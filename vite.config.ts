import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';

import {
  getResumeDataWatchPaths,
  loadResumeData,
} from './src/data/load-resume-data';
import {
  getResumeRenderTarget,
  redactResumeData,
} from './src/features/pdf-download/build';
import { resumePdfPlugin } from './src/features/pdf-download/build/vite-plugin';
import { getDocumentTitle, getMetaDescription } from './src/helpers/seo';

const RESUME_DATA_MODULE_ID = 'virtual:resume-data';
const RESUME_DATA_MODULE_RESOLVED_ID = '\0virtual:resume-data';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function resumeDataPlugin(mode: string): PluginOption {
  const watchedResumeDataPaths = getResumeDataWatchPaths();
  const getResumeSourceData = () => loadResumeData({ mode });
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

export default defineConfig(({ mode }) => {
  const renderTarget = getResumeRenderTarget();

  return {
    plugins: [
      react(),
      tailwindcss(),
      resumeDataPlugin(mode),
      renderTarget === 'web' ? resumePdfPlugin() : null,
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __RESUME_RENDER_TARGET__: JSON.stringify(renderTarget),
    },
    publicDir: 'public',
    root: '.',
    server: {
      host: true,
    },
    build: {
      outDir: process.env.RESUME_BUILD_OUT_DIR || 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
    },
  };
});
