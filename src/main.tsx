import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import './index.css';
import './localization/i18n';
import { defaultLanguage } from './localization/config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${defaultLanguage}`} replace />} />
        <Route path="/:lang" element={<App />} />
        <Route path="*" element={<Navigate to={`/${defaultLanguage}`} replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
