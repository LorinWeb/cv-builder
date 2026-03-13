import { createRoot } from 'react-dom/client';

import App from './components/App';
import resumeData from './data/resume';
import { getDocumentTitle, getMetaDescription } from './helpers/seo';
import type { ResumeData } from './data/types/resume';
import './styles/app.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container was not found.');
}

const root = createRoot(container);

function syncDocumentHead(data: ResumeData) {
  document.title = getDocumentTitle(data);

  let metaDescription = document.head.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );

  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.append(metaDescription);
  }

  metaDescription.content = getMetaDescription(data);
}

function renderApp(data: ResumeData) {
  syncDocumentHead(data);
  root.render(<App data={data} />);
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
