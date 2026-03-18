import { createRoot } from 'react-dom/client';

import App from './components/App';
import resumeData from './data/resume';
import {
  isResumeStudioPreviewMessage,
  isResumeStudioPreviewMode,
  RESUME_STUDIO_PREVIEW_EVENT,
} from './features/resume-studio/runtime';
import { getDocumentTitle, getMetaDescription } from './helpers/seo';
import type { ResumeRuntimeData } from './data/types/resume';
import './styles/index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container was not found.');
}

const root = createRoot(container);
const resumeStudioPreviewMode = isResumeStudioPreviewMode();

function syncDocumentTitle(data: ResumeRuntimeData) {
  try {
    document.title = getDocumentTitle(data);
  } catch {
    if (!document.title.trim()) {
      document.title = 'Resume';
    }
  }
}

function syncMetaDescription(data: ResumeRuntimeData) {
  let metaDescription = document.head.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );

  try {
    const content = getMetaDescription(data);

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.append(metaDescription);
    }

    metaDescription.content = content;
  } catch {
    if (metaDescription && !metaDescription.content.trim()) {
      metaDescription.remove();
    }
  }
}

function syncDocumentHead(data: ResumeRuntimeData) {
  syncDocumentTitle(data);
  syncMetaDescription(data);
}

function renderApp(data: ResumeRuntimeData) {
  syncDocumentHead(data);
  root.render(<App data={data} isResumeStudioPreview={resumeStudioPreviewMode} />);
}

renderApp(resumeData);

if (import.meta.hot) {
  import.meta.hot.accept('./data/resume', (nextModule) => {
    if (!nextModule) {
      return;
    }

    renderApp(nextModule.default);
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener(RESUME_STUDIO_PREVIEW_EVENT, (event) => {
    const previewEvent = event as CustomEvent<ResumeRuntimeData>;

    renderApp(previewEvent.detail);
  });

  if (resumeStudioPreviewMode) {
    window.addEventListener('message', (event) => {
      if (!isResumeStudioPreviewMessage(event.data)) {
        return;
      }

      renderApp(event.data.data);
    });
  }
}
