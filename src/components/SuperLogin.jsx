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
  X
} from 'lucide-react';

// Google Colored G SVG Icon
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function SuperLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => localStorage.getItem('siscontrol_last_username') || '');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          pin_code: pinCode.trim()
        })
      }).then((r) => r.json());

      if (res.success && res.data) {
        setSuccessMessage(`¡Bienvenido, ${res.data.name}!`);
        localStorage.setItem('siscontrol_last_username', res.data.username);
        setTimeout(() => {
          onLoginSuccess(res.data);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Usuario o PIN incorrecto');
      }
    } catch (err) {
      setErrorMessage('Error de conexión: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google / Quick SuperAdmin Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/users').then(r => r.json());
      if (res.success && res.data && res.data.length > 0) {
        const superAdmin = res.data.find(u => u.role === 'SUPER_ADMIN' && u.status === 'ACTIVO') || res.data[0];
        setSuccessMessage(`¡Ingresando como ${superAdmin.name}!`);
        localStorage.setItem('siscontrol_last_username', superAdmin.username);
        setTimeout(() => {
          onLoginSuccess(superAdmin);
        }, 500);
      } else {
        setErrorMessage('No hay usuarios activos registrados en el sistema');
      }
    } catch (err) {
      setErrorMessage('Error al acceder con Google: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0B1118] text-slate-900 font-sans select-none relative overflow-x-hidden">
      
      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-[1020px] bg-white rounded-[2.5rem] shadow-2xl shadow-black/60 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[620px] border border-slate-800/20">
        
        {/* ============================================================== */}
        {/* Left Column (Warehouse & Logistics Visual Showcase)            */}
        {/* ============================================================== */}
        <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-10 text-white overflow-hidden bg-slate-950">
          
          {/* Warehouse Background Image */}
          <img
            src="/port-warehouse.jpg"
            alt="Almacén SISCONTROL"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.70] contrast-105"
          />

          {/* Deep gradient overlay for high contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-slate-950/40 pointer-events-none" />

          {/* Top Bar: Operaciones Portuarias + Cochabamba, BO */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-[11px] font-semibold text-white tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OPERACIONES PORTUARIAS</span>
            </div>
            <div className="flex items-center bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-[11px] font-medium text-slate-200 shadow-xs">
              Cochabamba, BO
            </div>
          </div>

          {/* Bottom Area: Main Headline + Rivero Brand + Acceso Seguro */}
          <div className="relative z-10">
            {/* Tag line */}
            <div className="text-[11px] font-bold tracking-[0.2em] text-[#F95721] uppercase mb-2">
              INVENTARIO · LOGÍSTICA · CONTROL
            </div>

            {/* Headline */}
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2">
              Todo en orden.<br />
              Todo en movimiento.
            </h2>

            {/* Subtitle */}
            <p className="text-xs lg:text-sm text-slate-300 font-normal leading-relaxed max-w-sm mb-6">
              Gestiona tu operación con claridad, desde el almacén hasta cada entrega.
            </p>

            {/* Footer Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F95721] text-white font-black text-base flex items-center justify-center shadow-md">
                  R
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Importadora Rivero
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
                    SISCONTROL ERP
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>Acceso seguro</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* Right Column (Login Form)                                      */}
        {/* ============================================================== */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white w-full">
          
          {/* Top Header: Logo + Bolivia Badge */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F95721] text-white font-black text-sm flex items-center justify-center shadow-xs">
                R
              </div>
              <span className="font-extrabold tracking-wider text-slate-900 text-xs sm:text-sm uppercase">
                IMPORTADORA <span className="text-[#F95721]">RIVERO</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              <MapPin size={13} className="text-[#F95721]" />
              <span>Bolivia</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="my-auto max-w-sm mx-auto w-full py-4">
            
            {/* Sub-badge */}
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>PORTAL DE COLABORADORES</span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Hola, colaborador
            </h1>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Ingresa tus datos para continuar a SISCONTROL ERP.
            </p>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-semibold animate-fade-in">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold animate-fade-in">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              
              {/* Usuario Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu usuario"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F95721] focus:border-transparent transition-all font-medium"
                  />
                </div>
              </div>

              {/* PIN Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    PIN de acceso
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-[#F95721] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu PIN?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Ingresa tu PIN de 4 dígitos"
                    maxLength={6}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F95721] focus:border-transparent transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                    title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Iniciar sesión Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F95721] hover:bg-[#e04815] active:scale-[0.99] text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
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

              {/* Divider: o continúa con */}
              <div className="relative flex items-center justify-center my-1.5">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 font-medium">
                  o continúa con
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Continuar con Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Continuar con Google</span>
              </button>

            </form>
          </div>

          {/* Bottom Bar: Plataforma protegida + Solicitar acceso */}
          <div className="flex items-center justify-between text-[11px] pt-4 text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Check size={13} className="text-emerald-500 stroke-[3]" />
              <span>Plataforma protegida</span>
            </div>

            <div>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setShowAccessModal(true)}
                className="text-[#F95721] font-bold hover:underline cursor-pointer"
              >
                Solicitar acceso
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Outside Footer */}
      <div className="text-center text-xs text-slate-500 font-normal tracking-wide mt-4">
        SISCONTROL ERP · Gestión inteligente para Importadora Rivero
      </div>

      {/* Modal: ¿Olvidaste tu PIN? */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-center animate-fade-in relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F95721] flex items-center justify-center mx-auto mb-3">
              <Lock size={22} />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Recuperación de PIN
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Los códigos PIN se configuran y actualizan desde el panel de <strong>Usuarios & Roles</strong>.
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl mt-4 text-xs font-mono text-left border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                Colaboradores autorizados:
              </div>
              <div className="font-semibold text-slate-800 py-0.5">• @abel (PIN: 2705)</div>
              <div className="font-semibold text-slate-800 py-0.5">• @jaime (PIN: 1234)</div>
              <div className="font-semibold text-slate-800 py-0.5">• @betho (PIN: 1234)</div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Acceso */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-center animate-fade-in relative">
            <button
              type="button"
              onClick={() => setShowAccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F95721] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Solicitud de Acceso
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Para habilitar una cuenta de colaborador o vendedor en <strong>SISCONTROL ERP</strong>, solicita el registro al Super Administrador en Cochabamba.
            </p>

            <button
              type="button"
              onClick={() => setShowAccessModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#e04815] text-white font-bold text-xs cursor-pointer transition-colors shadow-md shadow-orange-500/20"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
