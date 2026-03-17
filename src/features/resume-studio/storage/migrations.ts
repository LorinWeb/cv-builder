import type { DatabaseSync } from 'node:sqlite';

function getTableColumns(database: DatabaseSync, tableName: string) {
  return database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
}

export function ensureResumeStudioSchema(database: DatabaseSync) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS resume_draft (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resume_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resume_studio_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_version_id INTEGER REFERENCES resume_versions(id)
    );
  `);

  const versionColumns = getTableColumns(database, 'resume_versions');

  if (!versionColumns.some((column) => column.name === 'updated_at')) {
    database.exec('ALTER TABLE resume_versions ADD COLUMN updated_at TEXT;');
  }

  database.exec(`
    UPDATE resume_versions
    SET updated_at = created_at
    WHERE updated_at IS NULL OR updated_at = '';
    INSERT INTO resume_studio_meta (id, active_version_id)
    VALUES (1, NULL)
    ON CONFLICT(id) DO NOTHING;
  `);
}
