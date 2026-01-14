import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import './styles/pages.css'
import './styles/global.css'

// Handle client-side routing for GitHub Pages
const getInitialPath = () => {
  const path = window.location.search.slice(1).split('&')[0];
  if (path) {
    return path.replace(/~and~/g, '&');
  }
  return '/';
};

const initialPath = getInitialPath();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App initialPath={initialPath} />
    </BrowserRouter>
  </React.StrictMode>
)
