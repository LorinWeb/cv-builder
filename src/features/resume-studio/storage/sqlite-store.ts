import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { ResumeSourceData } from '../../../data/types/resume';
import type { ResumeVersionSummary } from '../types';

interface VersionRecord {
  created_at: string;
  id: number;
  is_active?: number;
  is_published?: number;
  markdown_text: string;
  name: string;
  updated_at: string;
}

interface MetaRecord {
  active_version_id: number | null;
  published_markdown_text: string | null;
  published_updated_at: string | null;
  published_version_id: number | null;
}

function ensureResumeStudioDirectory(filePath: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function tableExists(database: DatabaseSync, tableName: string) {
  const record = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
    )
    .get(tableName) as { name: string } | undefined;

  return Boolean(record);
}

function getTableColumns(database: DatabaseSync, tableName: string) {
  if (!tableExists(database, tableName)) {
    return [];
  }

  return database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
}

function resetLegacySchema(database: DatabaseSync) {
  database.exec('PRAGMA foreign_keys = OFF;');
  database.exec(`
    DROP TABLE IF EXISTS resume_studio_meta;
    DROP TABLE IF EXISTS resume_versions;
    DROP TABLE IF EXISTS resume_draft;
  `);
  database.exec('PRAGMA foreign_keys = ON;');
}

function ensureResumeStudioSchema(database: DatabaseSync) {
  database.exec('PRAGMA journal_mode = WAL;');

  const hasLegacyDraft = tableExists(database, 'resume_draft');
  const versionColumns = getTableColumns(database, 'resume_versions');
  const metaColumns = getTableColumns(database, 'resume_studio_meta');
  const usesMarkdownVersions = versionColumns.some((column) => column.name === 'markdown_text');
  const usesMarkdownMeta = metaColumns.some(
    (column) => column.name === 'published_markdown_text'
  );

  if (
    hasLegacyDraft ||
    (versionColumns.length > 0 && !usesMarkdownVersions) ||
    (metaColumns.length > 0 && !usesMarkdownMeta)
  ) {
    resetLegacySchema(database);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS resume_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      markdown_text TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resume_studio_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_version_id INTEGER REFERENCES resume_versions(id),
      published_version_id INTEGER REFERENCES resume_versions(id),
      published_markdown_text TEXT,
      published_updated_at TEXT
    );
    INSERT INTO resume_studio_meta (id, active_version_id)
    VALUES (1, NULL)
    ON CONFLICT(id) DO NOTHING;
  `);
}

function toResumeData(markdown: string): ResumeSourceData {
  return { markdown };
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
        'SELECT id, name, created_at, updated_at, markdown_text FROM resume_versions WHERE id = ?'
      )
      .get(id) as VersionRecord | undefined;

    if (!record) {
      return null;
    }

    return {
      createdAt: record.created_at,
      data: toResumeData(record.markdown_text),
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
            resume_versions.markdown_text
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
      data: toResumeData(record.markdown_text),
      id: record.id,
      name: record.name,
      updatedAt: record.updated_at,
    };
  }

  getPublishedState() {
    const meta = this.database
      .prepare(
        `
          SELECT
            active_version_id,
            published_version_id,
            published_markdown_text,
            published_updated_at
          FROM resume_studio_meta
          WHERE id = 1
        `
      )
      .get() as MetaRecord | undefined;

    if (
      !meta ||
      meta.published_version_id === null ||
      !meta.published_markdown_text ||
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
      data: toResumeData(meta.published_markdown_text),
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
            markdown_text = @markdown_text,
            updated_at = @updated_at
          WHERE id = @id
        `
      )
      .run({
        id,
        markdown_text: data.markdown,
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
        'INSERT INTO resume_versions (name, created_at, updated_at, markdown_text) VALUES (?, ?, ?, ?)'
      )
      .run(name, createdAt, updatedAt, data.markdown);

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
            published_markdown_text,
            published_updated_at
          )
          VALUES (1, NULL, @published_version_id, @published_markdown_text, @published_updated_at)
          ON CONFLICT(id) DO UPDATE SET
            published_version_id = excluded.published_version_id,
            published_markdown_text = excluded.published_markdown_text,
            published_updated_at = excluded.published_updated_at
        `
      )
      .run({
        published_markdown_text: data.markdown,
        published_updated_at: updatedAt,
        published_version_id: id,
      });
  }
}
