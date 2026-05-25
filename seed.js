const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'sibsiu',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '111111',
});

async function main() {
  const dataFile = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(dataFile)) {
    console.error('Файл seed-data.json не найден.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const jsonTables = ['surveys', 'ankety', 'programs', 'responses', 'survey_links'];
    for (const table of jsonTables) {
      const rows = data[table] || [];
      let inserted = 0;
      for (const item of rows) {
        if (!item.id) continue;
        const res = await client.query(
          `INSERT INTO ${table} (id, data) VALUES ($1, $2)
           ON CONFLICT (id) DO NOTHING`,
          [item.id, JSON.stringify(item)]
        );
        inserted += res.rowCount;
      }
      console.log(`${table}: добавлено ${inserted} из ${rows.length}`);
    }

    const groups = data.student_groups || [];
    let insertedSg = 0;
    for (const g of groups) {
      if (!g.id) continue;
      const res = await client.query(
        `INSERT INTO student_groups (id, program_name, name, count)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.programName, g.name, g.count]
      );
      insertedSg += res.rowCount;
    }
    console.log(`student_groups: добавлено ${insertedSg} из ${groups.length}`);

    await client.query('COMMIT');
    console.log('Готово.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
