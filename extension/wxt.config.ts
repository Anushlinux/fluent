import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  manifest: {
    name: 'Fluent',
    description: 'Educational browser extension that annotates Web3 jargon terms',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['glossary.json', 'icon.svg'],
        matches: ['<all_urls>'],
      },
    ],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content-scripts/content.js'],
        css: ['content-scripts/content.css'],
      },
    ],
  },
  vite: () => ({
    plugins: [react()],
  }),
});

