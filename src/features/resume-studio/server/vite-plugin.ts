import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';

import { RESUME_STUDIO_API_ROOT } from '../constants';
import { getResumeStudioDraftFieldErrors } from '../draft';
import type {
  ResumeStudioApiErrorPayload,
  ResumeStudioCreateVersionPayload,
  ResumeStudioDraftPayload,
} from '../types';
import { createResumeStudioStore } from '../storage/store';

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
) {
  response.statusCode = statusCode;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function sendError(
  response: ServerResponse,
  statusCode: number,
  error: string,
  fieldErrors?: Record<string, string>
) {
  const payload: ResumeStudioApiErrorPayload = { error };

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    payload.fieldErrors = fieldErrors;
  }

  sendJson(response, statusCode, payload);
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function getVersionId(pathname: string) {
  const versionId = pathname.split('/')[3];

  return versionId ? Number(versionId) : null;
}

export function resumeStudioPlugin(projectRoot: string): Plugin {
  const store = createResumeStudioStore(projectRoot);

  async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
    next: Connect.NextFunction
  ) {
    if (!request.url) {
      next();
      return;
    }

    const url = new URL(request.url, 'http://127.0.0.1');

    if (!url.pathname.startsWith(RESUME_STUDIO_API_ROOT)) {
      next();
      return;
    }

    try {
      if (request.method === 'GET' && url.pathname === `${RESUME_STUDIO_API_ROOT}/state`) {
        sendJson(response, 200, store.getState());
        return;
      }

      if (request.method === 'POST' && url.pathname === `${RESUME_STUDIO_API_ROOT}/init`) {
        sendJson(response, 200, store.initializeDraft());
        return;
      }

      if (request.method === 'PUT' && url.pathname === `${RESUME_STUDIO_API_ROOT}/draft`) {
        const payload = await readJsonBody<ResumeStudioDraftPayload>(request);
        const fieldErrors = getResumeStudioDraftFieldErrors(payload.draft);

        if (fieldErrors) {
          sendError(response, 400, 'Resume draft failed validation.', fieldErrors);
          return;
        }

        sendJson(response, 200, store.saveDraft(payload.draft));
        return;
      }

      if (
        request.method === 'POST' &&
        url.pathname === `${RESUME_STUDIO_API_ROOT}/publish`
      ) {
        sendJson(response, 200, store.publishActiveVersion());
        return;
      }

      if (
        request.method === 'POST' &&
        url.pathname === `${RESUME_STUDIO_API_ROOT}/versions`
      ) {
        const payload = await readJsonBody<ResumeStudioCreateVersionPayload>(request);

        sendJson(response, 200, store.createVersion(payload.name));
        return;
      }

      if (
        request.method === 'DELETE' &&
        /^\/__resume-studio\/versions\/\d+$/.test(url.pathname)
      ) {
        const versionId = getVersionId(url.pathname);

        if (versionId === null) {
          sendError(response, 404, 'Resume Studio endpoint was not found.');
          return;
        }

        sendJson(response, 200, store.deleteVersion(versionId));
        return;
      }

      if (
        request.method === 'POST' &&
        /^\/__resume-studio\/versions\/\d+\/select$/.test(url.pathname)
      ) {
        const versionId = getVersionId(url.pathname);

        if (versionId === null) {
          sendError(response, 404, 'Resume Studio endpoint was not found.');
          return;
        }

        sendJson(response, 200, store.selectVersion(versionId));
        return;
      }

      sendError(response, 404, 'Resume Studio endpoint was not found.');
    } catch (error) {
      sendError(
        response,
        500,
        error instanceof Error ? error.message : 'Resume Studio request failed.'
      );
    }
  }

  return {
    configureServer(server) {
      server.middlewares.use(handleRequest);
      server.httpServer?.once('close', () => {
        store.close();
      });
    },
    name: 'resume-studio',
  };
}
