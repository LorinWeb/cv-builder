import path from 'node:path';

import type { Plugin, ResolvedConfig } from 'vite';

import { getResumeDataWatchPaths } from '../../../data/load-resume-data';
import { emitResumePdf } from './pipeline';

function resolveViteConfigFile(config: ResolvedConfig) {
  if (!config.configFile) {
    throw new Error(
      'Resume PDF generation requires a file-backed Vite config so nested PDF render builds can reuse it.'
    );
  }

  return config.configFile;
}

export function resumePdfPlugin(projectRoot?: string): Plugin {
  let resolvedConfig: ResolvedConfig | null = null;

  function getWatchedResumeDataPaths() {
    if (!resolvedConfig) {
      throw new Error(
        'resumePdfPlugin must receive configResolved before resolving resume data.'
      );
    }

      return getResumeDataWatchPaths({
        projectRoot: projectRoot || resolvedConfig.root,
      });
  }

  async function generatePdf(outputRootDir: string, tempDirPrefix: string) {
    if (!resolvedConfig) {
      throw new Error('resumePdfPlugin must receive configResolved before generating a PDF.');
    }

    await emitResumePdf({
      configFile: resolveViteConfigFile(resolvedConfig),
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
      server.watcher.add(getWatchedResumeDataPaths());
      await generatePdf(server.config.publicDir, 'cv-lorin-dev-pdf-build-');
    },
    async handleHotUpdate(context) {
      if (!getWatchedResumeDataPaths().includes(context.file)) {
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
