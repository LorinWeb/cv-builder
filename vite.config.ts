import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type PluginOption } from 'vite';

import { loadResumeData, resolveResumeDataPath } from './src/data/load-resume-data';
import { getDocumentTitle, getMetaDescription } from './src/helpers/seo';

const RESUME_DATA_MODULE_ID = 'virtual:resume-data';
const RESUME_DATA_MODULE_RESOLVED_ID = '\0virtual:resume-data';
const RESUME_DATA_DIRECTORY = fileURLToPath(new URL('./src/data', import.meta.url));

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function isResumeDataJsonFile(file: string) {
  const relativePath = path.relative(RESUME_DATA_DIRECTORY, file);

  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath) && file.endsWith('.json');
}

function resumeDataPlugin(mode: string): PluginOption {
  const getResumeData = () => loadResumeData({ mode });

  return {
    name: 'resume-data',
    resolveId(id) {
      if (id === RESUME_DATA_MODULE_ID) {
        return RESUME_DATA_MODULE_RESOLVED_ID;
      }
    },
    load(id) {
      if (id !== RESUME_DATA_MODULE_RESOLVED_ID) {
        return;
      }

      return `const resumeData = ${JSON.stringify(getResumeData())};\nexport default resumeData;\n`;
    },
    buildStart() {
      this.addWatchFile(resolveResumeDataPath({ mode }));
    },
    configureServer(server) {
      server.watcher.add(RESUME_DATA_DIRECTORY);
    },
    handleHotUpdate(context) {
      if (!isResumeDataJsonFile(context.file)) {
        return;
      }

      const virtualModule = context.server.moduleGraph.getModuleById(
        RESUME_DATA_MODULE_RESOLVED_ID
      );
      const resumeModule = context.server.moduleGraph.getModuleById(
        fileURLToPath(new URL('./src/data/resume.ts', import.meta.url))
      );
      const modules = [virtualModule, resumeModule].filter(
        (module): module is NonNullable<typeof module> => Boolean(module)
      );

      for (const module of modules) {
        context.server.moduleGraph.invalidateModule(module);
      }

      return modules;
    },
    transformIndexHtml(html) {
      const resumeData = getResumeData();
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
  return {
    plugins: [
      react(),
      tailwindcss(),
      resumeDataPlugin(mode),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    publicDir: 'public',
    root: '.',
    server: {
      host: true,
    },
    build: {
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
