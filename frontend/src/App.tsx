import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './lib/theme';
import { AuthProvider } from './lib/auth';
import { queryClient } from './lib/queryClient';
import { ProtectedRoute } from './components/ui/ProtectedRoute';

// Pages
import TokenDemo    from './pages/TokenDemo';
import Landing      from './pages/Landing';
import Login        from './pages/Login';
import Signup       from './pages/Signup';
import Onboarding   from './pages/Onboarding';
import AppLayout    from './pages/app/Layout';
import Chat         from './pages/app/Chat';
import Dashboard    from './pages/app/Dashboard';
import Transactions from './pages/app/Transactions';
import Analytics    from './pages/app/Analytics';
import Reports      from './pages/app/Reports';
import Upload       from './pages/app/Upload';
import AppSettings  from './pages/app/Settings';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"           element={<Landing />} />
              <Route path="/token-demo" element={<TokenDemo />} />
              <Route path="/login"      element={<Login />} />
              <Route path="/signup"     element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Protected app shell */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index               element={<Chat />} />
                <Route path="dashboard"    element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics"    element={<Analytics />} />
                <Route path="reports"      element={<Reports />} />
                <Route path="upload"       element={<Upload />} />
                <Route path="settings"     element={<AppSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
