import { HashRouter, BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ingresos from './pages/Ingresos';
import Facturacion from './pages/Facturacion';
import Reparaciones from './pages/Reparaciones';
import FobiChat from './pages/FobiChat';
import { IS_DEMO } from './config/demo';

const Router = IS_DEMO ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingresos"
            element={
              <ProtectedRoute>
                <Ingresos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute>
                <Facturacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reparaciones"
            element={
              <ProtectedRoute>
                <Reparaciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fobi"
            element={
              <ProtectedRoute>
                <FobiChat />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
