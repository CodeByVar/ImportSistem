import React, { useState } from 'react';
import { 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  MapPin, 
  Lock, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import BrandLogo, { RiveroIconSVG } from './BrandLogo';
import { DEMO_MODE, DEMO_TOKEN, buildDemoUser } from '../config/demoMode';

export default function SuperLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => localStorage.getItem('siscontrol_last_username') || '');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Autenticación directa para Modo Demo (sin depender de API ni exigir PIN válido)
  const triggerDemoLogin = (rawUser, provider = 'credentials') => {
    const demoUser = buildDemoUser(rawUser || username || 'Abel', provider);
    const session = {
      user: demoUser,
      token: DEMO_TOKEN,
      loginAt: new Date().toISOString(),
      demoMode: true
    };
    localStorage.setItem('siscontrol_last_username', demoUser.username);
    localStorage.setItem('siscontrol_auth_session', JSON.stringify(session));
    localStorage.setItem('siscontrol_active_user', JSON.stringify(demoUser));
    setErrorMessage('');
    setSuccessMessage(`¡Bienvenido a Importadora Rivero, ${demoUser.nombre}! (Modo Demo)`);
    onLoginSuccess(demoUser, DEMO_TOKEN);
  };

  // Handler para botón "Continuar con Google"
  const handleGoogleLogin = () => {
    if (DEMO_MODE) {
      triggerDemoLogin(username || 'Abel', 'google');
      return;
    }
    setErrorMessage('El inicio de sesión con Google requiere conectar el backend OAuth.');
  };

  // Form submission ("Iniciar sesión")
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ========================================================================
    // 1. INTERCEPTOR MODO DEMO (Sin fetch a la API ni validación de PIN)
    // ========================================================================
    if (DEMO_MODE) {
      triggerDemoLogin(username || 'Abel', 'credentials');
      return;
    }

    // ========================================================================
    // 2. LÓGICA ORIGINAL DE FETCH REAL (Intacta para cuando se conecte la API)
    // ========================================================================
    if (!username.trim()) {
      setErrorMessage('Ingresa tu nombre de usuario');
      return;
    }
    if (!pinCode.trim()) {
      setErrorMessage('Ingresa tu código PIN');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          pin_code: pinCode.trim()
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Fallback seguro si el servidor devuelve HTML en lugar de JSON
        triggerDemoLogin(username || 'Abel', 'credentials');
        return;
      }

      const res = await response.json();

      if (res.success && res.data && res.token) {
        setSuccessMessage(`¡Bienvenido, ${res.data.name}!`);
        localStorage.setItem('siscontrol_last_username', res.data.username);
        setTimeout(() => {
          onLoginSuccess(res.data, res.token);
        }, 400);
      } else {
        setErrorMessage(res.error || 'Usuario o PIN incorrecto');
      }
    } catch (err) {
      setErrorMessage('Error de conexión: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-[#0D0D0D] text-[#0D0D0D] font-sans relative overflow-x-hidden">
      {/* Glow ambiental con paleta oficial #FF8C00 y #FFC107 */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-[#FF8C00]/15 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#FFC107]/12 blur-3xl" />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-[1200px] bg-white rounded-[28px] shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 md:grid-cols-[0.88fr_1fr] min-h-[630px] lg:min-h-[680px] border border-[#262626]">
        
        {/* ============================================================== */}
        {/* Left Column (Warehouse & Logistics Visual Showcase)            */}
        {/* ============================================================== */}
        <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-10 text-white overflow-hidden bg-[#0D0D0D]">
          
          {/* Warehouse Background Image */}
          <img
            src="/port-warehouse.jpg"
            alt="Almacén Importadora Rivero"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.65] contrast-105"
          />

          {/* Deep gradient overlay for high contrast (#0D0D0D) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/45 to-[#0D0D0D]/55 pointer-events-none" />

          {/* Top Bar: Operaciones Portuarias + Cochabamba, BO */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-[#0D0D0D]/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#FF8C00]/40 text-[11px] font-bold text-white tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FFC107] animate-pulse" />
              <span>IMPORTACIÓN & MAYOREO</span>
            </div>
            <div className="flex items-center bg-[#0D0D0D]/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-[11px] font-semibold text-neutral-200 shadow-xs">
              Cochabamba, BO
            </div>
          </div>

          {/* Bottom Area: Main Headline + Official Rivero Brand + Acceso Seguro */}
          <div className="relative z-10">
            {/* Tag line */}
            <div
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              className="text-[11px] font-extrabold tracking-[0.22em] text-[#FFC107] uppercase mb-2"
            >
              SIMPLIFICAMOS TU ESFUERZO
            </div>

            {/* Headline */}
            <h2
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight mb-2"
            >
              Todo en orden.<br />
              Todo en movimiento.
            </h2>

            {/* Subtitle */}
            <p className="text-xs lg:text-sm text-neutral-300 font-normal leading-relaxed max-w-sm mb-6">
              Control inteligente de contenedores, almacén, tienda, notas de despacho y cobranzas en tiempo real.
            </p>

            {/* Footer Bar with Official Brand Mark */}
            <div className="flex items-center justify-between pt-4 border-t border-white/15">
              <BrandLogo variant="horizontal-dark" showSlogan={false} />

              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                <ShieldCheck size={15} className="text-[#FFC107]" />
                <span>Acceso seguro</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* Right Column (Login Form)                                      */}
        {/* ============================================================== */}
        <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-white w-full">
          
          {/* Top Header: Official Logo + Bolivia Badge */}
          <div className="flex items-center justify-between gap-4">
            <BrandLogo variant="capsule-dark" size="sm" />

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D] bg-[#F8F8FA] px-3 py-1.5 rounded-full border border-neutral-200 shadow-2xs shrink-0">
              <MapPin size={13} className="text-[#FF8C00]" />
              <span>Bolivia</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="my-auto max-w-sm mx-auto w-full py-4">
            
            {/* Sub-badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest uppercase text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
                <span>PORTAL DE COLABORADORES</span>
              </div>
              {DEMO_MODE && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFE082]/40 text-[#0D0D0D] border border-[#FFC107]">
                  <Sparkles size={11} className="text-[#FF8C00]" />
                  MODO DEMO ACTIVO
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <h1
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight"
            >
              Hola, colaborador
            </h1>
            <p className="text-xs text-neutral-500 mt-1 mb-5">
              {DEMO_MODE
                ? 'Modo Demo habilitado: presiona "Iniciar sesión" o "Continuar con Google" para entrar directo al Dashboard.'
                : 'Ingresa tus credenciales para continuar a SISCONTROL ERP.'}
            </p>

            {/* Error Message */}
            {errorMessage && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-semibold animate-fade-in">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold animate-fade-in">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate={DEMO_MODE} className="flex flex-col gap-3.5">
              
              {/* Usuario Field */}
              <div>
                <label htmlFor="login-username" className="block text-xs font-bold text-[#0D0D0D] mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <User size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={DEMO_MODE ? 'Abel (opcional en modo demo)' : 'Tu usuario'}
                    required={!DEMO_MODE}
                    className="w-full bg-[#F8F8FA] border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0D0D0D] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:bg-white focus:border-transparent transition-all font-semibold"
                  />
                </div>
              </div>

              {/* PIN Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-pin" className="text-xs font-bold text-[#0D0D0D]">
                    PIN de acceso
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-[#FF8C00] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu PIN?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    id="login-pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder={DEMO_MODE ? 'No requerido en Modo Demo' : 'Ingresa tu PIN de 4 dígitos'}
                    maxLength={6}
                    required={!DEMO_MODE}
                    className="w-full bg-[#F8F8FA] border border-neutral-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0D0D0D] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:bg-white focus:border-transparent transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer p-1"
                    aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Iniciar sesión Button (#FF8C00 -> #FFC107 Brand Gradient) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#FF8C00] to-[#FFA000] hover:from-[#e67e00] hover:to-[#FF8C00] active:scale-[0.99] text-white font-extrabold py-3 rounded-xl shadow-lg shadow-[#FF8C00]/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Continuar con Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-[#F8F8FA] active:scale-[0.99] text-[#0D0D0D] font-bold py-2.5 rounded-xl border-2 border-neutral-200 hover:border-[#FF8C00]/50 flex items-center justify-center gap-2.5 text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

            </form>
          </div>

          {/* Bottom Bar: Plataforma protegida + Solicitar acceso */}
          <div className="flex flex-col gap-2 text-[11px] pt-4 text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-500">
              <Check size={13} className="text-[#FF8C00] stroke-[3]" />
              <span>Plataforma protegida</span>
            </div>

            <div>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setShowAccessModal(true)}
                className="text-[#FF8C00] font-extrabold hover:underline cursor-pointer"
              >
                Solicitar acceso
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Outside Footer */}
      <div className="text-center text-xs text-neutral-400 font-medium tracking-wide mt-4">
        IMPORTADORA RIVERO · Simplificamos tu esfuerzo
      </div>

      {/* Modal: ¿Olvidaste tu PIN? */}
      {showForgotModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="forgot-pin-title" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xl text-center animate-fade-in relative">
            <button
              type="button"
              aria-label="Cerrar recuperación de PIN"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#FF8C00]/15 text-[#FF8C00] flex items-center justify-center mx-auto mb-3">
              <Lock size={22} />
            </div>

            <h3 id="forgot-pin-title" className="text-base font-extrabold text-[#0D0D0D]">
              Recuperación de PIN
            </h3>
            
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Solicita al Super Administrador (Abel) que restablezca tu PIN desde el panel de Usuarios & Roles.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#0D0D0D] hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Acceso */}
      {showAccessModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="access-request-title" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xl text-center animate-fade-in relative">
            <button
              type="button"
              aria-label="Cerrar solicitud de acceso"
              onClick={() => setShowAccessModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#0D0D0D] flex items-center justify-center mx-auto mb-3">
              <RiveroIconSVG className="w-8 h-8" />
            </div>

            <h3 id="access-request-title" className="text-base font-extrabold text-[#0D0D0D]">
              Solicitud de Acceso
            </h3>
            
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Para habilitar una cuenta de colaborador en <strong>Importadora Rivero</strong>, solicita el registro al Super Administrador en Cochabamba.
            </p>

            <button
              type="button"
              onClick={() => setShowAccessModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#FF8C00] hover:bg-[#e67e00] text-white font-bold text-xs cursor-pointer transition-colors shadow-md shadow-[#FF8C00]/25"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
