import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { ResumeSourceData } from '../../../data/types/resume';
import type { ResumeVersionSummary } from '../types';

interface DraftRecord {
  data_json: string;
  updated_at: string;
}

interface VersionRecord {
  created_at: string;
  data_json: string;
  id: number;
  is_active?: number;
  is_published?: number;
  name: string;
  updated_at: string;
}

interface MetaRecord {
  active_version_id: number | null;
  published_data_json: string | null;
  published_updated_at: string | null;
  published_version_id: number | null;
}

function ensureResumeStudioDirectory(filePath: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function getTableColumns(database: DatabaseSync, tableName: string) {
  return database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
}

function ensureResumeStudioSchema(database: DatabaseSync) {
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
      active_version_id INTEGER REFERENCES resume_versions(id),
      published_version_id INTEGER REFERENCES resume_versions(id),
      published_data_json TEXT,
      published_updated_at TEXT
    );
  `);

  const versionColumns = getTableColumns(database, 'resume_versions');
  const metaColumns = getTableColumns(database, 'resume_studio_meta');

  if (!versionColumns.some((column) => column.name === 'updated_at')) {
    database.exec('ALTER TABLE resume_versions ADD COLUMN updated_at TEXT;');
  }

  if (!metaColumns.some((column) => column.name === 'published_version_id')) {
    database.exec(
      'ALTER TABLE resume_studio_meta ADD COLUMN published_version_id INTEGER REFERENCES resume_versions(id);'
    );
  }

  if (!metaColumns.some((column) => column.name === 'published_data_json')) {
    database.exec('ALTER TABLE resume_studio_meta ADD COLUMN published_data_json TEXT;');
  }

  if (!metaColumns.some((column) => column.name === 'published_updated_at')) {
    database.exec('ALTER TABLE resume_studio_meta ADD COLUMN published_updated_at TEXT;');
  }

  database.exec(`
    UPDATE resume_versions
    SET updated_at = created_at
    WHERE updated_at IS NULL OR updated_at = '';
    INSERT INTO resume_studio_meta (id, active_version_id)
    VALUES (1, NULL)
    ON CONFLICT(id) DO NOTHING;
    UPDATE resume_studio_meta
    SET
      published_version_id = active_version_id,
      published_data_json = (
        SELECT data_json
        FROM resume_versions
        WHERE id = resume_studio_meta.active_version_id
      ),
      published_updated_at = (
        SELECT updated_at
        FROM resume_versions
        WHERE id = resume_studio_meta.active_version_id
      )
    WHERE published_version_id IS NULL
      AND active_version_id IS NOT NULL;
  `);
}

export class SqliteResumeStudioStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    ensureResumeStudioDirectory(databasePath);
    this.database = new DatabaseSync(databasePath);
    ensureResumeStudioSchema(this.database);
  }

  close() {
    this.database.close();
  }

  getLegacyDraft() {
    const record = this.database
      .prepare('SELECT data_json, updated_at FROM resume_draft WHERE id = 1')
      .get() as DraftRecord | undefined;

    if (!record) {
      return null;
    }

    return {
      data: JSON.parse(record.data_json) as ResumeSourceData,
      updatedAt: record.updated_at,
    };
  }

  getMeta() {
    const record = this.database
      .prepare(
        `
          SELECT
            active_version_id,
            published_version_id,
            published_data_json,
            published_updated_at
          FROM resume_studio_meta
          WHERE id = 1
        `
      )
      .get() as MetaRecord | undefined;

    return (
      record || {
        active_version_id: null,
        published_data_json: null,
        published_updated_at: null,
        published_version_id: null,
      }
    );
  }

  listVersions(): ResumeVersionSummary[] {
    const records = this.database
      .prepare(
        `
          SELECT
            resume_versions.id,
            resume_versions.name,
            resume_versions.created_at,
            resume_versions.updated_at,
            CASE
              WHEN resume_versions.id = (
                SELECT active_version_id FROM resume_studio_meta WHERE id = 1
              ) THEN 1
              ELSE 0
            END AS is_active,
            CASE
              WHEN resume_versions.id = (
                SELECT published_version_id FROM resume_studio_meta WHERE id = 1
              ) THEN 1
              ELSE 0
            END AS is_published
          FROM resume_versions
          ORDER BY is_active DESC, datetime(updated_at) DESC, id DESC
        `
      )
      .all() as unknown as VersionRecord[];

    return records.map((record) => ({
      createdAt: record.created_at,
      id: record.id,
      isActive: Boolean(record.is_active),
      isPublished: Boolean(record.is_published),
      name: record.name,
      updatedAt: record.updated_at,
    }));
  }

  getVersion(id: number) {
    const record = this.database
      .prepare(
        'SELECT id, name, created_at, updated_at, data_json FROM resume_versions WHERE id = ?'
      )
      .get(id) as VersionRecord | undefined;

    if (!record) {
      return null;
    }

    return {
      createdAt: record.created_at,
      data: JSON.parse(record.data_json) as ResumeSourceData,
      id: record.id,
      name: record.name,
      updatedAt: record.updated_at,
    };
  }

  getActiveVersion() {
    const record = this.database
      .prepare(
        `
          SELECT
            resume_versions.id,
            resume_versions.name,
            resume_versions.created_at,
            resume_versions.updated_at,
            resume_versions.data_json
          FROM resume_versions
          INNER JOIN resume_studio_meta
            ON resume_studio_meta.id = 1
            AND resume_studio_meta.active_version_id = resume_versions.id
        `
      )
      .get() as VersionRecord | undefined;

    if (!record) {
      return null;
    }

    return {
      createdAt: record.created_at,
      data: JSON.parse(record.data_json) as ResumeSourceData,
      id: record.id,
      name: record.name,
      updatedAt: record.updated_at,
    };
  }

  getPublishedState() {
    const meta = this.getMeta();

    if (
      meta.published_version_id === null ||
      !meta.published_data_json ||
      !meta.published_updated_at
    ) {
      return null;
    }

    const version = this.database
      .prepare('SELECT id, name FROM resume_versions WHERE id = ?')
      .get(meta.published_version_id) as Pick<VersionRecord, 'id' | 'name'> | undefined;

    if (!version) {
      return null;
    }

    return {
      data: JSON.parse(meta.published_data_json) as ResumeSourceData,
      id: version.id,
      name: version.name,
      updatedAt: meta.published_updated_at,
    };
  }

  updateVersion(id: number, data: ResumeSourceData, updatedAt: string) {
    this.database
      .prepare(
        `
          UPDATE resume_versions
          SET
            data_json = @data_json,
            updated_at = @updated_at
          WHERE id = @id
        `
      )
      .run({
        data_json: JSON.stringify(data),
        id,
        updated_at: updatedAt,
      });
  }

  createVersion(
    name: string,
    data: ResumeSourceData,
    createdAt: string,
    updatedAt = createdAt
  ) {
    const result = this.database
      .prepare(
        'INSERT INTO resume_versions (name, created_at, updated_at, data_json) VALUES (?, ?, ?, ?)'
      )
      .run(name, createdAt, updatedAt, JSON.stringify(data));

    return Number(result.lastInsertRowid);
  }

  deleteVersion(id: number) {
    const result = this.database
      .prepare('DELETE FROM resume_versions WHERE id = ?')
      .run(id);

    if (result.changes === 0) {
      throw new Error(`Resume Studio version ${id} was not found.`);
    }
  }

  setActiveVersion(id: number | null) {
    this.database
      .prepare(
        `
          INSERT INTO resume_studio_meta (id, active_version_id)
          VALUES (1, ?)
          ON CONFLICT(id) DO UPDATE SET
            active_version_id = excluded.active_version_id
        `
      )
      .run(id);
  }

  setPublishedVersion(id: number, data: ResumeSourceData, updatedAt: string) {
    this.database
      .prepare(
        `
          INSERT INTO resume_studio_meta (
            id,
            active_version_id,
            published_version_id,
            published_data_json,
            published_updated_at
          )
          VALUES (1, NULL, @published_version_id, @published_data_json, @published_updated_at)
          ON CONFLICT(id) DO UPDATE SET
            published_version_id = excluded.published_version_id,
            published_data_json = excluded.published_data_json,
            published_updated_at = excluded.published_updated_at
        `
      )
      .run({
        published_data_json: JSON.stringify(data),
        published_updated_at: updatedAt,
        published_version_id: id,
      });
  }
}
