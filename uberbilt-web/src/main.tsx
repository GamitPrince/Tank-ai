import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AppProvider } from './store';
import './index.css';

const GOOGLE_CLIENT_ID =
  '1089039652155-q2rvcq0mgiol4hcnvkf1ci2182mfdnrb.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
