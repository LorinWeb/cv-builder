import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';

import {
  getResumeDataWatchPaths,
  loadResumeData,
} from './src/data/load-resume-data';
import {
  getResumeRenderTarget,
  redactResumeData,
} from './src/features/pdf-download/build';
import { resumePdfPlugin } from './src/features/pdf-download/build/vite-plugin';
import { RESUME_STUDIO_WATCH_IGNORED_PATTERNS } from './src/features/resume-studio/constants';
import { resumeStudioPlugin } from './src/features/resume-studio/server/vite-plugin';
import { getDocumentTitle, getMetaDescription } from './src/helpers/seo';

const RESUME_DATA_MODULE_ID = 'virtual:resume-data';
const RESUME_DATA_MODULE_RESOLVED_ID = '\0virtual:resume-data';
const MANUAL_CHUNK_RULES = [
  ['react-vendor', ['react', 'react-dom']],
  ['markdown-vendor', ['react-markdown', 'remark-gfm']],
  ['resume-studio-form', ['@base-ui/react', 'react-hook-form']],
  ['resume-studio-editor', ['@mdxeditor/editor']],
] as const;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

interface AppViteConfigOptions {
  command: 'build' | 'serve';
  dataProjectRoot?: string;
  enableResumePdf?: boolean;
  enableResumeStudio?: boolean;
  mode: string;
}

function resumeDataPlugin(mode: string, projectRoot: string): PluginOption {
  const watchedResumeDataPaths = getResumeDataWatchPaths({
    projectRoot,
  });
  const getResumeSourceData = () => loadResumeData({ mode, projectRoot });
  const getPublicResumeData = () => redactResumeData(getResumeSourceData());
  const getSerializedResumeData = () =>
    getResumeRenderTarget() === 'pdf'
      ? getResumeSourceData()
      : getPublicResumeData();

  return {
    name: 'resume-data',
    resolveId(id) {
      if (id === RESUME_DATA_MODULE_ID) {
        return RESUME_DATA_MODULE_RESOLVED_ID;
      }
    },
    load(id) {
      if (id === RESUME_DATA_MODULE_RESOLVED_ID) {
        return `const resumeData = ${JSON.stringify(getSerializedResumeData())};\nexport default resumeData;\n`;
      }
    },
    buildStart() {
      for (const watchedResumeDataPath of watchedResumeDataPaths) {
        this.addWatchFile(watchedResumeDataPath);
      }
    },
    configureServer(server) {
      server.watcher.add(watchedResumeDataPaths);
    },
    handleHotUpdate(context) {
      if (!watchedResumeDataPaths.includes(context.file)) {
        return;
      }

      const modules = [
        context.server.moduleGraph.getModuleById(RESUME_DATA_MODULE_RESOLVED_ID),
        context.server.moduleGraph.getModuleById(
          fileURLToPath(new URL('./src/data/resume.ts', import.meta.url))
        ),
      ].filter((module): module is NonNullable<typeof module> => Boolean(module));

      for (const module of modules) {
        context.server.moduleGraph.invalidateModule(module);
      }

      return modules;
    },
    transformIndexHtml(html) {
      const resumeData = getPublicResumeData();
      const description = getMetaDescription(resumeData);
      const title = getDocumentTitle(resumeData);

      return {
        html: html.replace(
          /<title>.*?<\/title>/s,
          `<title>${escapeHtml(title)}</title>`
        ),
        tags: [
          {
            tag: 'meta',
            attrs: {
              name: 'description',
              content: description,
            },
            injectTo: 'head',
          },
        ],
      };
    },
  };
}

function getManualChunkName(id: string) {
  if (!id.includes('/node_modules/')) {
    return undefined;
  }

  for (const [chunkName, packages] of MANUAL_CHUNK_RULES) {
    if (packages.some((packageName) => id.includes(`/node_modules/${packageName}/`))) {
      return chunkName;
    }
  }

  return undefined;
}

export function createAppViteConfig({
  command,
  dataProjectRoot,
  enableResumePdf,
  enableResumeStudio,
  mode,
}: AppViteConfigOptions): UserConfig {
  const appRoot = fileURLToPath(new URL('.', import.meta.url));
  const resolvedDataProjectRoot = path.resolve(appRoot, dataProjectRoot || '.');
  const renderTarget = getResumeRenderTarget();
  const shouldEnableResumePdf = enableResumePdf ?? renderTarget === 'web';
  const shouldEnableResumeStudio =
    enableResumeStudio ?? (command === 'serve' && mode !== 'test');

  return {
    plugins: [
      react(),
      tailwindcss(),
      resumeDataPlugin(mode, resolvedDataProjectRoot),
      shouldEnableResumePdf ? resumePdfPlugin(resolvedDataProjectRoot) : null,
      shouldEnableResumeStudio ? resumeStudioPlugin(resolvedDataProjectRoot) : null,
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __RESUME_RENDER_TARGET__: JSON.stringify(renderTarget),
    },
    publicDir: path.resolve(resolvedDataProjectRoot, 'public'),
    root: appRoot,
    server: {
      host: true,
      watch: {
        ignored: [...RESUME_STUDIO_WATCH_IGNORED_PATTERNS],
      },
    },
    build: {
      outDir: process.env.RESUME_BUILD_OUT_DIR || 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: getManualChunkName,
        },
      },
    },
  };
}

export default defineConfig(({ command, mode }) =>
  createAppViteConfig({
    command,
    mode,
  })
);
