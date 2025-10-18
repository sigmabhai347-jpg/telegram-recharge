import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(/*#__PURE__*/React.createElement(React.StrictMode, null, /*#__PURE__*/React.createElement(App, null)));