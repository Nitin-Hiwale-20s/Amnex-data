import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/rajdhani/400.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import './styles.css';
import App from './App.jsx';
import { initMobileTables } from './mobile.js';

createRoot(document.getElementById('root')).render(<App />);
initMobileTables();
