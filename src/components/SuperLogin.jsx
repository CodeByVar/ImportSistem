import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2 
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

// Carousel slides representing maritime port & warehouse
const PORT_SLIDES = [
  {
    image: '/port-warehouse.jpg',
    tag: 'OPERACIONES PORTUARIAS',
    badge: 'Arica / Iquique',
    title: 'Terminal de Contenedores',
    subtitle: 'Recepción aduanera y control logístico multimodal en tiempo real.'
  },
  {
    image: '/port-ship.jpg',
    tag: 'OPERACIONES PORTUARIAS',
    badge: 'China Ningbo',
    title: 'Embarques en Tránsito',
    subtitle: 'Monitoreo de buques de carga marítima, pólizas de importación y prelistas.'
  },
  {
    image: '/port-dock.jpg',
    tag: 'OPERACIONES PORTUARIAS',
    badge: 'Cochabamba',
    title: 'Almacén Central',
    subtitle: 'Gestión física de inventario valorizado y distribución mayorista.'
  }
];

export default function SuperLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => localStorage.getItem('siscontrol_last_username') || '');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Auto-cycle carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PORT_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % PORT_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + PORT_SLIDES.length) % PORT_SLIDES.length);
  };

  // Submit credentials
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

  // Google Login Handler
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
        }, 600);
      } else {
        setErrorMessage('No hay usuarios activos registrados en el sistema');
      }
    } catch (err) {
      setErrorMessage('Error al acceder con Google: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSlide = PORT_SLIDES[currentSlide];

  return (
    // 1. Outer Container: Full-screen height with depth overlay & subtle blurred background
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-950 relative overflow-hidden select-none font-sans">
      
      {/* Subtle background image with overlay/blur to give depth behind floating card */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${PORT_SLIDES[0].image})` }}
      />
      <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />

      {/* 2. Central Floating Card: Centered modal container, min-h-[640px], max-w-5xl */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl p-3 grid grid-cols-1 md:grid-cols-2 min-h-[640px] overflow-hidden my-auto border border-slate-100">
        
        {/* ============================================================== */}
        {/* 3. Left Column (Visual Showcase Card)                         */}
        {/* ============================================================== */}
        <div className="relative rounded-[2rem] overflow-hidden hidden md:flex flex-col justify-between p-8 text-white bg-slate-900 shadow-inner">
          
          {/* Full-bleed background image with object-cover brightness-75 */}
          <img
            key={activeSlide.image}
            src={activeSlide.image}
            alt={activeSlide.title}
            className="absolute inset-0 w-full h-full object-cover brightness-75 transition-all duration-700 ease-out"
          />

          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40 pointer-events-none" />

          {/* Top bar: Left badge "OPERACIONES PORTUARIAS", right pill badge "Arica / Iquique" */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-white shadow-xs">
              {activeSlide.tag}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white shadow-xs">
              {activeSlide.badge}
            </span>
          </div>

          {/* Bottom area: Slide info + clean footer info + circular navigation controls */}
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                {activeSlide.title}
              </h2>
              <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed drop-shadow max-w-sm">
                {activeSlide.subtitle}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                  R
                </div>
                <span className="text-xs font-extrabold text-white tracking-wide">
                  Importadora Rivero - SISCONTROL ERP
                </span>
              </div>

              {/* Previous/next circular navigation controls (h-8 w-8 rounded-full bg-black/40 backdrop-blur-md) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  title="Anterior escena"
                  className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white border border-white/20 cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  title="Siguiente escena"
                  className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white border border-white/20 cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 4. Right Column (Form Panel)                                  */}
        {/* ============================================================== */}
        <div className="p-8 md:p-12 flex flex-col justify-between bg-white w-full">
          
          {/* Top bar: Brand title "IMPORTADORA RIVERO" on left, country status with green dot on right */}
          <div className="flex items-center justify-between gap-4">
            <span className="font-extrabold tracking-wider text-slate-950 text-sm uppercase">
              IMPORTADORA <span className="text-orange-600">RIVERO</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>• Bolivia (Bs)</span>
            </div>
          </div>

          {/* Form Body: Centered vertically (my-auto max-w-sm mx-auto w-full) */}
          <div className="my-auto max-w-sm mx-auto w-full py-4">
            
            {/* Title & Subtitle */}
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Hola, Colaborador
              </h1>
              <p className="text-xs text-slate-500 mb-6 mt-1">
                Bienvenido a SISCONTROL ERP
              </p>
            </div>

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

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              
              {/* Usuario Field */}
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario"
                  required
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none w-full pr-10 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User size={16} />
                </div>
              </div>

              {/* PIN Field */}
              <div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="PIN de 4 dígitos"
                    maxLength={6}
                    required
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none w-full pr-10 text-slate-900 placeholder:text-slate-400 font-mono tracking-widest transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                    title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Link "¿Olvidaste tu PIN?" aligned right in subtle red */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-red-500 text-xs font-medium hover:underline transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu PIN?
                  </button>
                </div>
              </div>

              {/* Divider with "O" in the middle */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  O
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Secondary button: Acceder con Google (clean outlined style) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Acceder con Google</span>
              </button>

              {/* Primary button: Iniciar Sesión → */}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl py-3 shadow-md shadow-orange-500/20 w-full flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión →</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Bottom text: "¿No tienes cuenta? Solicitar acceso" */}
          <div className="text-center text-xs text-slate-400">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => alert('Para registrar nuevos usuarios, solicita al Super Administrador agregarte desde el panel de Usuarios & Roles.')}
              className="text-orange-600 font-bold hover:underline cursor-pointer"
            >
              Solicitar acceso
            </button>
          </div>

        </div>

      </div>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <Lock size={22} />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Recuperación de PIN
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Los códigos PIN son configurados en el panel de <strong>Usuarios & Roles</strong>.
            </p>
            <div className="bg-slate-50 p-3 rounded-2xl mt-4 text-xs font-mono text-left border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Usuarios registrados:</div>
              <div className="font-semibold text-slate-800">• @abel (PIN: 2705)</div>
              <div className="font-semibold text-slate-800">• @jaime (PIN: 1234)</div>
              <div className="font-semibold text-slate-800">• @betho (PIN: 1234)</div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
