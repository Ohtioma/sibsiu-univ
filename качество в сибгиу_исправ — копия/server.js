const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname)));
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'sibsiu',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '111111',
});
const ARRAY_KEYS = new Set(['surveys', 'ankety', 'programs', 'responses', 'surveyLinks', 'studentGroups']);
const TABLE_NAME = {
  surveys:       'surveys',
  ankety:        'ankety',
  programs:      'programs',
  responses:     'responses',
  surveyLinks:   'survey_links',
  studentGroups: 'student_groups',
};
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS surveys       (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS ankety        (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS programs      (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS responses     (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS survey_links  (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS student_groups(
      id           TEXT PRIMARY KEY,
      program_name TEXT NOT NULL,
      name         TEXT NOT NULL,
      count        INTEGER NOT NULL DEFAULT 0
    );
  `);
}
async function readArrayKey(table) {
  if (table === 'student_groups') {
    const res = await pool.query(`SELECT id, program_name, name, count FROM student_groups`);
    return res.rows.map(r => ({ id: r.id, programName: r.program_name, name: r.name, count: r.count }));
  }
  const res = await pool.query(`SELECT data FROM ${table}`);
  return res.rows.map(r => r.data);
}
async function writeArrayKey(table, arr) {
  if (!Array.isArray(arr)) arr = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newIds = arr.map(item => item.id).filter(Boolean);
    if (newIds.length > 0) {
      await client.query(`DELETE FROM ${table} WHERE id <> ALL($1::text[])`, [newIds]);
    } else {
      await client.query(`DELETE FROM ${table}`);
    }
    if (table === 'student_groups') {
      for (const item of arr) {
        if (!item.id) continue;
        await client.query(
          `INSERT INTO student_groups (id, program_name, name, count)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET program_name=EXCLUDED.program_name, name=EXCLUDED.name, count=EXCLUDED.count`,
          [item.id, item.programName, item.name, item.count]
        );
      }
    } else {
      for (const item of arr) {
        if (!item.id) continue;
        await client.query(
          `INSERT INTO ${table} (id, data) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [item.id, JSON.stringify(item)]
        );
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
async function readKey(key) {
  if (ARRAY_KEYS.has(key)) return readArrayKey(TABLE_NAME[key]);
  return null;
}
async function writeKey(key, value) {
  if (ARRAY_KEYS.has(key)) return writeArrayKey(TABLE_NAME[key], value);
}
async function readAll() {
  const result = {};
  for (const [key, table] of Object.entries(TABLE_NAME)) {
    result[key] = await readArrayKey(table);
  }
  return result;
}
app.get('/api/data', async (req, res) => {
  try { res.json(await readAll()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/data/:key', async ({ params }, res) => {
  try { res.json(await readKey(params.key)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/data/:key', async ({ params, body }, res) => {
  try { await writeKey(params.key, body.value); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/ping', (req, res) => res.json({ ok: true }));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Ошибка подключения к БД:', err.message);
  process.exit(1);
});