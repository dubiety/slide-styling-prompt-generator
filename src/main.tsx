import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import './index.css';
import './localization/i18n';
import { defaultLanguage, languageStorageKey, parseLanguage } from './localization/config';

function getPreferredLanguage() {
  if (typeof window === 'undefined') return defaultLanguage;
  const storedLanguage = window.localStorage.getItem(languageStorageKey);
  return parseLanguage(storedLanguage ?? undefined) ?? defaultLanguage;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${getPreferredLanguage()}`} replace />} />
        <Route path="/:lang" element={<App />} />
        <Route path="*" element={<Navigate to={`/${getPreferredLanguage()}`} replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
