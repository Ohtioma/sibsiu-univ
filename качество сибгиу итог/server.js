require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname)));
app.use(session({
  secret: process.env.SESSION_SECRET || 'sibgiu-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 },
}));

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'sibsiu',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '111111',
});

const ARRAY_KEYS = new Set(['surveys', 'ankety', 'programs', 'responses', 'accessTokens', 'studentGroups', 'surveyLinks']);
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
      count        INTEGER NOT NULL DEFAULT 0,
      code         TEXT NOT NULL DEFAULT ''
    );
    ALTER TABLE student_groups ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';
  `);
}

async function readArrayKey(table) {
  if (table === 'student_groups') {
    const res = await pool.query(`SELECT id, program_name, name, count, code FROM student_groups`);
    return res.rows.map(r => ({ id: r.id, programName: r.program_name, name: r.name, count: r.count, code: r.code || '' }));
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
          `INSERT INTO student_groups (id, program_name, name, count, code)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET program_name=EXCLUDED.program_name, name=EXCLUDED.name, count=EXCLUDED.count, code=EXCLUDED.code`,
          [item.id, item.programName, item.name, item.count, item.code || '']
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

// --- Auth middleware ---

function requireAdmin(req, res, next) {
  if (req.session?.role === 'admin') return next();
  return res.status(401).json({ error: 'Не авторизован' });
}

function requireAuth(req, res, next) {
  if (req.session?.role === 'admin' || req.session?.role === 'participant') return next();
  return res.status(401).json({ error: 'Не авторизован' });
}

// --- Auth routes ---

app.post('/api/login', (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) return res.status(400).json({ error: 'Укажите логин и пароль' });
  const adminLogin = process.env.ADMIN_LOGIN || 'admin';
  const adminPass  = process.env.ADMIN_PASSWORD || 'admin';
  if (login === adminLogin && password === adminPass) {
    req.session.role = 'admin';
    return res.json({ ok: true, role: 'admin' });
  }
  return res.status(401).json({ error: 'Неверный логин или пароль' });
});

// Участники, переходящие по ссылке #survey=<linkId>
app.post('/api/link-auth', async (req, res) => {
  const { linkId } = req.body || {};
  if (!linkId) return res.status(400).json({ error: 'Не указан linkId' });
  try {
    const result = await pool.query(`SELECT data FROM survey_links WHERE id = $1`, [linkId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Ссылка не найдена' });
    const link = result.rows[0].data;
    if (req.session?.role === 'admin') {
      return res.json({ ok: true, role: 'admin', surveyId: link.surveyId });
    }
    if ((link.usedCount || 0) >= link.limit) {
      return res.status(403).json({ error: 'Лимит прохождений исчерпан' });
    }
    req.session.role     = 'participant';
    req.session.linkId   = linkId;
    req.session.surveyId = link.surveyId;
    return res.json({ ok: true, role: 'participant', surveyId: link.surveyId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// --- Data routes ---

app.get('/api/data', async (req, res) => {
  try { res.json(await readAll()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/data/:key', async ({ params }, res) => {
  try { res.json(await readKey(params.key)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/data/:key', requireAuth, async (req, res) => {
  const { params, body, session } = req;
  // Участники могут писать только ответы и ссылки
  if (session.role === 'participant' && !['responses', 'surveyLinks'].includes(params.key)) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  try { await writeKey(params.key, body.value); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ping', (req, res) => res.json({ ok: true, role: req.session?.role || null }));

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
