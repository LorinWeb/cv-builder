import path from 'node:path';

import type { Plugin, ResolvedConfig } from 'vite';

import { resolveResumeDataPath } from './index';
import { emitResumePdf } from './pipeline';

function resolveViteConfigFile(config: ResolvedConfig) {
  if (!config.configFile) {
    throw new Error(
      'Resume PDF generation requires a file-backed Vite config so nested PDF render builds can reuse it.'
    );
  }

  return config.configFile;
}

export function resumePdfPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig | null = null;

  function getResumeDataPath() {
    if (!resolvedConfig) {
      throw new Error('resumePdfPlugin must receive configResolved before resolving resume data.');
    }

    return resolveResumeDataPath({
      mode: resolvedConfig.mode,
      projectRoot: resolvedConfig.root,
    });
  }

  async function generatePdf(outputRootDir: string, tempDirPrefix: string) {
    if (!resolvedConfig) {
      throw new Error('resumePdfPlugin must receive configResolved before generating a PDF.');
    }

    await emitResumePdf({
      configFile: resolveViteConfigFile(resolvedConfig),
      mode: resolvedConfig.mode,
      outputRootDir,
      tempDirPrefix,
    });
  }

  return {
    name: 'resume-pdf',
    configResolved(config) {
      resolvedConfig = config;
    },
    async configureServer(server) {
      server.watcher.add(getResumeDataPath());
      await generatePdf(server.config.publicDir, 'cv-lorin-dev-pdf-build-');
    },
    async handleHotUpdate(context) {
      if (path.resolve(context.file) !== getResumeDataPath()) {
        return;
      }

      await generatePdf(context.server.config.publicDir, 'cv-lorin-dev-pdf-build-');
    },
    async closeBundle() {
      if (!resolvedConfig || resolvedConfig.command !== 'build') {
        return;
      }

      await generatePdf(
        path.resolve(resolvedConfig.root, resolvedConfig.build.outDir),
        'cv-lorin-pdf-build-'
      );
    },
  };
}
