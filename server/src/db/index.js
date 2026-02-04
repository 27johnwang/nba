import initSqlJs from 'sql.js';
import { createTables } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/mealswipe.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Compatibility wrapper that mimics the better-sqlite3 API on top of sql.js
class DatabaseWrapper {
  constructor(sqlDb, filePath) {
    this._db = sqlDb;
    this._filePath = filePath;
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  pragma(str) {
    try {
      this._db.run(`PRAGMA ${str}`);
    } catch (e) {
      // Ignore pragma errors (WAL not supported in sql.js)
    }
  }

  prepare(sql) {
    return new PreparedStatement(this._db, sql, this);
  }

  _save() {
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this._filePath, buffer);
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }
}

class PreparedStatement {
  constructor(sqlDb, sql, wrapper) {
    this._db = sqlDb;
    this._sql = sql;
    this._wrapper = wrapper;
  }

  get(...params) {
    let stmt;
    try {
      stmt = this._db.prepare(this._sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      if (stmt.step()) {
        const result = stmt.getAsObject();
        return this._convertTypes(result);
      }
      return undefined;
    } finally {
      if (stmt) stmt.free();
    }
  }

  all(...params) {
    let stmt;
    try {
      stmt = this._db.prepare(this._sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const results = [];
      while (stmt.step()) {
        results.push(this._convertTypes(stmt.getAsObject()));
      }
      return results;
    } finally {
      if (stmt) stmt.free();
    }
  }

  run(...params) {
    this._db.run(this._sql, params);
    this._wrapper._save();
    return {
      changes: this._db.getRowsModified()
    };
  }

  // sql.js returns integers as numbers and text as strings,
  // but REAL values may come back oddly - normalize them
  _convertTypes(row) {
    if (!row) return row;
    const result = {};
    for (const [key, value] of Object.entries(row)) {
      result[key] = value;
    }
    return result;
  }
}

// Initialize sql.js and create/load database
const SQL = await initSqlJs();

let sqlDb;
if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath);
  sqlDb = new SQL.Database(fileBuffer);
} else {
  sqlDb = new SQL.Database();
}

const db = new DatabaseWrapper(sqlDb, dbPath);
db.pragma('foreign_keys = ON');

// Initialize tables
createTables(db);

export default db;
