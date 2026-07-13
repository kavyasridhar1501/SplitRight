const fs = require('fs');
const path = require('path');
const { pool } = require('../lib/db');

async function applyMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8');
  await pool.query(sql);
}

async function truncateAll() {
  await pool.query('TRUNCATE TABLE settlements, expense_splits, expenses, group_members, groups, users RESTART IDENTITY CASCADE');
}

beforeAll(async () => {
  await applyMigrations();
});

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await pool.end();
});
