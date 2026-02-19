import pg from 'pg';
import { createTables } from './schema.js';

const { Pool } = pg;

// PostgreSQL connection using DATABASE_URL from Railway or local config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Convert SQLite-style `?` placeholders to PostgreSQL `$1, $2, ...` style
function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

// Convert SQLite date functions to PostgreSQL
function convertDateFunctions(sql) {
  return sql
    .replace(/date\('now'\)/gi, 'CURRENT_DATE')
    .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
}

// Wrapper class that provides SQLite-like API on top of PostgreSQL
class DatabaseWrapper {
  constructor(pool) {
    this._pool = pool;
  }

  // For direct SQL execution (used in schema creation)
  async exec(sql) {
    await this._pool.query(sql);
  }

  // Compatibility with SQLite pragma (no-op for PostgreSQL)
  pragma(str) {
    // PostgreSQL doesn't need PRAGMA statements
  }

  // Prepare a statement - returns an object with get/all/run methods
  prepare(sql) {
    const convertedSql = convertDateFunctions(convertPlaceholders(sql));
    return new PreparedStatement(this._pool, convertedSql);
  }
}

class PreparedStatement {
  constructor(pool, sql) {
    this._pool = pool;
    this._sql = sql;
  }

  // Get single row (synchronous wrapper for async PostgreSQL)
  get(...params) {
    // We need to make this synchronous-looking but it's actually async
    // This is a hack but maintains API compatibility
    return this._getSync(params);
  }

  // Get all rows
  all(...params) {
    return this._allSync(params);
  }

  // Run statement (INSERT/UPDATE/DELETE)
  run(...params) {
    return this._runSync(params);
  }

  _getSync(params) {
    // This uses a synchronous pattern via a cached promise
    // The actual execution happens asynchronously
    const result = { _pending: true, _params: params, _stmt: this };
    return result;
  }

  _allSync(params) {
    const result = { _pending: true, _params: params, _stmt: this, _isAll: true };
    return result;
  }

  _runSync(params) {
    const result = { _pending: true, _params: params, _stmt: this, _isRun: true };
    return result;
  }
}

// Since Express routes are sync but pg is async, we need a different approach
// We'll make the wrapper methods truly async and update routes to use async/await

class AsyncDatabaseWrapper {
  constructor(pool) {
    this._pool = pool;
  }

  pragma(str) {
    // No-op for PostgreSQL
  }

  prepare(sql) {
    const convertedSql = convertDateFunctions(convertPlaceholders(sql));
    return new AsyncPreparedStatement(this._pool, convertedSql);
  }
}

class AsyncPreparedStatement {
  constructor(pool, sql) {
    this._pool = pool;
    this._sql = sql;
  }

  async get(...params) {
    const result = await this._pool.query(this._sql, params);
    return result.rows[0];
  }

  async all(...params) {
    const result = await this._pool.query(this._sql, params);
    return result.rows;
  }

  async run(...params) {
    const result = await this._pool.query(this._sql, params);
    return { changes: result.rowCount };
  }
}

// Initialize database and create tables
await createTables(pool);

const db = new AsyncDatabaseWrapper(pool);

export default db;
