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
  const data = {};

  const jsonTables = ['surveys', 'ankety', 'programs', 'responses', 'survey_links'];
  for (const table of jsonTables) {
    const res = await pool.query(`SELECT data FROM ${table}`);
    data[table] = res.rows.map(r => r.data);
  }

  const sg = await pool.query(`SELECT id, program_name, name, count FROM student_groups`);
  data.student_groups = sg.rows.map(r => ({
    id:          r.id,
    programName: r.program_name,
    name:        r.name,
    count:       r.count,
  }));

  const out = path.join(__dirname, 'seed-data.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Экспортировано в ${out}`);
  for (const [k, v] of Object.entries(data)) {
    console.log(`  ${k}: ${v.length} записей`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
