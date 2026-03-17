import { DatabaseSync } from 'node:sqlite';

import type { ResumeSourceData } from '../../../data/types/resume';
import type { ResumeVersionSummary } from '../types';
import { ensureResumeStudioDirectory } from './json-sync';
import { ensureResumeStudioSchema } from './migrations';

interface DraftRecord {
  data_json: string;
  updated_at: string;
}

interface VersionRecord {
  created_at: string;
  data_json: string;
  id: number;
  is_active?: number;
  name: string;
  updated_at: string;
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
            END AS is_active
          FROM resume_versions
          ORDER BY is_active DESC, datetime(updated_at) DESC, id DESC
        `
      )
      .all() as unknown as VersionRecord[];

    return records.map((record) => ({
      createdAt: record.created_at,
      id: record.id,
      isActive: Boolean(record.is_active),
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

  setActiveVersion(id: number) {
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
}
