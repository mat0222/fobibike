import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FiLock, FiUser, FiAlertCircle, FiArrowRight, FiEye } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { assetUrl, IS_DEMO } from '../config/demo';

export default function Login() {
  const { enterDemo, login, isAuthenticated, loading } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (IS_DEMO) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="lg:hidden relative h-48 sm:h-56 shrink-0 overflow-hidden">
          <img
            src={assetUrl('login-cyclists.jpg')}
            alt="Ciclistas en montaña"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a8f]/80 to-[#1a3a8f]/30" />
          <img
            src={assetUrl('FOBIBike.png')}
            alt="FOBI Bike"
            className="absolute bottom-4 left-6 h-12 object-contain drop-shadow-lg"
          />
        </div>

        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
          <img
            src={assetUrl('login-cyclists.jpg')}
            alt="Ciclistas en montaña"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-[#1a3a8f]/40 to-[#1a3a8f]/20" />
          <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
            <img
              src={assetUrl('FOBIBike.png')}
              alt="FOBI Bike"
              className="w-44 xl:w-52 object-contain drop-shadow-lg"
            />
            <div>
              <p className="text-[#22c55e] text-sm font-semibold uppercase tracking-widest mb-3">
                Vista previa pública
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight max-w-md">
                Conocé la estructura del panel de FOBI Bike
              </h1>
              <p className="text-blue-100/70 mt-4 max-w-sm text-sm leading-relaxed">
                Inventario, ingresos y asistente IA — sin datos reales del negocio.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-[#f8fafc] px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0a1628]">Demo pública</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Recorré el diseño del sistema. Los archivos y datos del inventario no se muestran por privacidad.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 mb-6">
              No hace falta usuario ni contraseña. Es solo una vista de la estructura.
            </div>

            <button
              type="button"
              onClick={enterDemo}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              <FiEye />
              Entrar a la demo
              <FiArrowRight />
            </button>

            <p className="text-center text-xs text-slate-400 mt-10">
              FOBI Bike &copy; {new Date().getFullYear()} — Demo sin datos sensibles
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(usuario, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:hidden relative h-48 sm:h-56 shrink-0 overflow-hidden">
        <img
          src={assetUrl('login-cyclists.jpg')}
          alt="Ciclistas en montaña"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a8f]/80 to-[#1a3a8f]/30" />
        <img
          src={assetUrl('FOBIBike.png')}
          alt="FOBI Bike"
          className="absolute bottom-4 left-6 h-12 object-contain drop-shadow-lg"
        />
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <img
          src={assetUrl('login-cyclists.jpg')}
          alt="Ciclistas en montaña"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-[#1a3a8f]/40 to-[#1a3a8f]/20" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <img
            src={assetUrl('FOBIBike.png')}
            alt="FOBI Bike"
            className="w-44 xl:w-52 object-contain drop-shadow-lg"
          />
          <div>
            <p className="text-[#22c55e] text-sm font-semibold uppercase tracking-widest mb-3">
              Tu bicicleteria de confianza
            </p>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight max-w-md">
              Gestion profesional para tu negocio
            </h1>
            <p className="text-blue-100/70 mt-4 max-w-sm text-sm leading-relaxed">
              Administra inventario, ventas e ingresos desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0a1628]">Bienvenido</h2>
            <p className="text-slate-500 mt-2 text-sm">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="usuario" className="block text-sm font-semibold text-slate-700 mb-2">
                Usuario
              </label>
              <div className="relative group">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb] transition-colors" />
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="nombre.de.usuario"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Contrasena
              </label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb] transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                <FiAlertCircle className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? 'Ingresando...' : 'Iniciar sesion'}
              {!submitting && <FiArrowRight />}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-10">
            FOBI Bike &copy; {new Date().getFullYear()} — Panel privado
          </p>
        </div>
      </div>
    </div>
  );
}
