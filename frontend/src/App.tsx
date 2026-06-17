import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './lib/theme';
import { AuthProvider } from './lib/auth';
import { queryClient } from './lib/queryClient';

// Pages
import TokenDemo      from './pages/TokenDemo';
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import Onboarding     from './pages/Onboarding';
import AppLayout      from './pages/app/Layout';
import Chat           from './pages/app/Chat';
import Dashboard      from './pages/app/Dashboard';
import Transactions   from './pages/app/Transactions';
import Analytics      from './pages/app/Analytics';
import Reports        from './pages/app/Reports';
import Upload         from './pages/app/Upload';
import AppSettings    from './pages/app/Settings';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Token demo — checkpoint 1 (swap for <Landing /> after cp1 verified) */}
              <Route path="/"            element={<TokenDemo />} />
              <Route path="/landing"     element={<Landing />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/signup"      element={<Signup />} />
              <Route path="/onboarding"  element={<Onboarding />} />

              {/* Authenticated app shell */}
              <Route path="/app" element={<AppLayout />}>
                <Route index              element={<Chat />} />
                <Route path="dashboard"   element={<Dashboard />} />
                <Route path="transactions"element={<Transactions />} />
                <Route path="analytics"   element={<Analytics />} />
                <Route path="reports"     element={<Reports />} />
                <Route path="upload"      element={<Upload />} />
                <Route path="settings"    element={<AppSettings />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
