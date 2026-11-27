import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Phone, 
  Briefcase, 
  Lock, 
  UserCheck, 
  Sparkles, 
  ShieldAlert,
  ArrowRight,
  Crown,
  Package,
  DollarSign,
  Info,
  User
} from 'lucide-react';

const ROLES_INFO = {
  SUPER_ADMIN: {
    label: 'Super Administrador',
    badgeClass: 'badge-emerald',
    iconComponent: Crown,
    color: '#10b981',
    description: 'Control total de la importadora, costos FOB, utilidades, finanzas, anulación y configuración de usuarios.'
  },
  ADMIN: {
    label: 'Administrador',
    badgeClass: 'badge-cyan',
    iconComponent: ShieldCheck,
    color: '#0284c7',
    description: 'Gestión operativa, inventarios, compras, notas de venta y reportes generales.'
  },
  VENTAS: {
    label: 'Ventas & Despachos',
    badgeClass: 'badge-amber',
    iconComponent: Briefcase,
    color: '#FF8C00',
    description: 'Emisión de notas de venta, cartera de clientes y consulta de precios de venta (mayorista, caja, especial).'
  },
  ALMACEN: {
    label: 'Almacén & Logística',
    badgeClass: 'badge-indigo',
    iconComponent: Package,
    color: '#6366f1',
    description: 'Planilla de despacho diario, conteo físico de cajas y recepción de contenedores en bodega.'
  },
  CAJA: {
    label: 'Caja & Cobranzas',
    badgeClass: 'badge-cyan',
    iconComponent: DollarSign,
    color: '#059669',
    description: 'Registro de cobros, abonos en efectivo/QR y seguimiento de estados de cuenta de clientes.'
  }
};

function RoleBadgeIcon({ role, size = 13 }) {
  const IconComp = ROLES_INFO[role]?.iconComponent || User;
  return <IconComp size={size} />;
}

const AVATAR_COLORS = [
  '#FF8C00', '#0284c7', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#0f172a'
];

export default function UsersModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onSwitchUser 
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [backups, setBackups] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [workSchedule, setWorkSchedule] = useState({ enabled: true, openHour: 7, closeHour: 19, scheduleLabel: '07:00 a 19:00' });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    pin_code: '',
    role: 'VENTAS',
    phone: '',
    avatar_color: '#FF8C00',
    status: 'ACTIVO',
    notes: ''
  });

  // Fetch users + backups + audit logs + work schedule
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersRes, backupsRes, logsRes, schedRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/system/backups').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/system/audit-logs?limit=25').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/system/work-schedule').then(r => r.json()).catch(() => ({ success: false }))
      ]);
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (backupsRes.success && backupsRes.data) {
        setBackups(backupsRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data);
      }
      if (schedRes.success && schedRes.data) {
        setWorkSchedule(schedRes.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkSchedule = async (nextConfig) => {
    setIsSavingSchedule(true);
    try {
      const res = await fetch('/api/system/work-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig)
      }).then(r => r.json());
      if (res.success && res.data) {
        setWorkSchedule(res.data);
        showNotification(res.message || 'Horario laboral actualizado');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleCreateBackupNow = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/system/backup', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        showNotification(res.message || 'Respaldo creado correctamente');
        fetchUsers();
      } else {
        setErrorMsg(res.error || 'No se pudo generar el respaldo');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setShowAddForm(false);
      setEditingUserId(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      pin_code: '',
      role: 'VENTAS',
      phone: '',
      avatar_color: '#FF8C00',
      status: 'ACTIVO',
      notes: ''
    });
    setEditingUserId(null);
    setShowAddForm(false);
    setErrorMsg('');
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      pin_code: '', // Vacío = conservar PIN cifrado actual
      role: user.role || 'VENTAS',
      phone: user.phone || '',
      avatar_color: user.avatar_color || '#FF8C00',
      status: user.status || 'ACTIVO',
      notes: user.notes || ''
    });
    setShowAddForm(true);
    setErrorMsg('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      setErrorMsg('Nombre completo y usuario son obligatorios');
      return;
    }
    if (!editingUserId && (!formData.pin_code || formData.pin_code.trim().length < 4)) {
      setErrorMsg('El PIN inicial debe tener al menos 4 dígitos/caracteres');
      return;
    }

    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const payload = { ...formData };
      if (editingUserId && !payload.pin_code?.trim()) {
        delete payload.pin_code; // Mantener el hash scrypt actual
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        showNotification(editingUserId ? 'Trabajador actualizado con éxito' : 'Nuevo trabajador registrado');
        fetchUsers();
        resetForm();
      } else {
        setErrorMsg(res.error || 'Error al guardar usuario');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al trabajador ${user.name} (@${user.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        showNotification(`Usuario ${user.name} eliminado`);
        fetchUsers();
      } else {
        alert(res.error || 'No se pudo eliminar el usuario');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 15, 29, 0.75)',
      backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-dark-surface)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden'
        }}
      >
        {/* Toast Notifier */}
        {toast && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            zIndex: 110,
            background: '#10b981',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}>
            <CheckCircle2 size={16} />
            <span>{toast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-glass)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255, 140, 0, 0.12)',
              border: '1px solid rgba(255, 140, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF8C00'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Gestión de Trabajadores & Roles
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Configura los usuarios del sistema y define qué puede ver cada rol.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn"
            style={{
              width: '34px',
              height: '34px',
              padding: 0,
              borderRadius: '10px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-dark-card)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>

          {/* Active User Card Banner */}
          {currentUser && (
            <div style={{
              background: 'rgba(255, 140, 0, 0.06)',
              border: '1px solid rgba(255, 140, 0, 0.25)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: currentUser.avatar_color || '#FF8C00',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SU'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {currentUser.name}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <RoleBadgeIcon role={currentUser.role} size={12} />
                      <span>Sesión Activa</span>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Rol: <strong>{ROLES_INFO[currentUser.role]?.label || currentUser.role}</strong> • Usuario: @{currentUser.username}
                  </span>
                </div>
              </div>

              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: '#FF8C00',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <UserPlus size={15} />
                  <span>Registrar Nuevo Trabajador</span>
                </button>
              )}
            </div>
          )}

          {/* Form: Add / Edit Worker */}
          {showAddForm && (
            <form 
              onSubmit={handleSaveUser}
              style={{
                background: 'rgba(15, 23, 42, 0.04)',
                border: '1px solid var(--border-glass)',
                borderRadius: '18px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={17} color="#FF8C00" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {editingUserId ? 'Editar Datos del Trabajador' : 'Registrar Nuevo Trabajador'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>

              {errorMsg && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {/* Nombre Completo */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    NOMBRE COMPLETO *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Daniel Rojas"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.80rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-glass)',
                      background: 'var(--bg-dark-card)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Nombre de Usuario */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    USUARIO / ALIAS *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. daniel"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.80rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-glass)',
                      background: 'var(--bg-dark-card)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Código PIN */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {editingUserId ? 'NUEVO PIN (opcional — vacío mantiene el actual)' : 'PIN DE ACCESO (mín. 4 dígitos) *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    maxLength={16}
                    placeholder={editingUserId ? '•••• (Sin cambios)' : 'Ej. 4829'}
                    value={formData.pin_code}
                    onChange={e => setFormData({ ...formData, pin_code: e.target.value })}
                    className="mono"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.80rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-glass)',
                      background: 'var(--bg-dark-card)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontWeight: 700
                    }}
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    TELÉFONO / WHATSAPP
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 70000000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.80rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-glass)',
                      background: 'var(--bg-dark-card)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Selector de Rol */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  ROL ASIGNADO & NIVEL DE ACCESO
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '8px'
                }}>
                  {Object.entries(ROLES_INFO).map(([roleKey, info]) => {
                    const isSelected = formData.role === roleKey;
                    return (
                      <div
                        key={roleKey}
                        onClick={() => setFormData({ ...formData, role: roleKey })}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? `2px solid ${info.color}` : '1px solid var(--border-glass)',
                          background: isSelected ? 'rgba(255, 140, 0, 0.08)' : 'var(--bg-dark-card)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <RoleBadgeIcon role={roleKey} size={14} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isSelected ? info.color : 'var(--text-main)' }}>
                            {info.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                          {info.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Avatar + Estado */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    COLOR DE IDENTIFICACIÓN:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {AVATAR_COLORS.map(c => (
                      <span
                        key={c}
                        onClick={() => setFormData({ ...formData, avatar_color: c })}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: c,
                          cursor: 'pointer',
                          border: formData.avatar_color === c ? '2px solid #ffffff' : 'none',
                          boxShadow: formData.avatar_color === c ? '0 0 0 2px #FF8C00' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      border: '1px solid var(--border-glass)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: '8px 20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      background: '#FF8C00',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {editingUserId ? 'Actualizar Trabajador' : 'Crear Trabajador'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List of Registered Users */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Trabajadores Registrados ({users.length})
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Configuración de acceso para la sucursal
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map((user) => {
                const roleInfo = ROLES_INFO[user.role] || ROLES_INFO.VENTAS;
                const isCurrent = currentUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    style={{
                      background: isCurrent ? 'rgba(255, 140, 0, 0.04)' : 'rgba(15, 23, 42, 0.03)',
                      border: isCurrent ? '1.5px solid rgba(255, 140, 0, 0.35)' : '1px solid var(--border-glass)',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Left: Avatar + Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: user.avatar_color || '#FF8C00',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {user.name}
                          </span>
                          <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <RoleBadgeIcon role={user.role} size={11} />
                            <span>{roleInfo.label}</span>
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: '0.68rem', color: '#FF8C00', fontWeight: 800 }}>
                              (Tú)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span>Usuario: <strong>@{user.username}</strong></span>
                          {user.phone && (
                            <span>Tel: <strong>{user.phone}</strong></span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
                            <Lock size={11} />
                            <span>PIN Cifrado</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Switch User Button */}
                      {!isCurrent && onSwitchUser && (
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchUser(user);
                            showNotification(`Cambiaste a usuario: ${user.name}`);
                          }}
                          className="btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: '1px solid var(--border-glass)',
                            background: 'var(--bg-dark-card)',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                          title="Cambiar sesión a este usuario para probar su rol"
                        >
                          <UserCheck size={13} />
                          <span>Probar como este usuario</span>
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(user)}
                        className="btn"
                        style={{
                          width: '30px',
                          height: '30px',
                          padding: 0,
                          borderRadius: '8px',
                          border: '1px solid var(--border-glass)',
                          background: 'var(--bg-dark-card)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Editar trabajador"
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Delete Button (protected for last super admin) */}
                      {user.role !== 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className="btn"
                          style={{
                            width: '30px',
                            height: '30px',
                            padding: 0,
                            borderRadius: '8px',
                            border: '1px solid rgba(244, 63, 94, 0.25)',
                            background: 'rgba(244, 63, 94, 0.08)',
                            color: '#fb7185',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Eliminar trabajador"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloqueo de Horario Laboral (07:00 AM a 07:00 PM) */}
          <div style={{
            background: workSchedule.enabled ? 'rgba(255, 140, 0, 0.08)' : 'rgba(148, 163, 184, 0.08)',
            border: workSchedule.enabled ? '1px solid rgba(255, 140, 0, 0.35)' : '1px solid var(--border-glass)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} color={workSchedule.enabled ? '#FF8C00' : '#94a3b8'} />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Horario Laboral de Acceso ({String(workSchedule.openHour).padStart(2, '0')}:00 AM – {String(workSchedule.closeHour).padStart(2, '0')}:00 PM)</span>
                    <span className={workSchedule.enabled ? 'badge badge-amber' : 'badge'} style={{ fontSize: '0.65rem' }}>
                      {workSchedule.enabled ? 'BLOQUEO ACTIVO' : 'DESACTIVADO (24H)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Fuera de este horario el sistema se cierra automáticamente para colaboradores. <strong>Solo tú (Super Admin) tienes acceso las 24 horas.</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Abre:</span>
                  <select
                    value={workSchedule.openHour}
                    disabled={isSavingSchedule}
                    onChange={(e) => handleSaveWorkSchedule({ ...workSchedule, openHour: Number(e.target.value) })}
                    className="form-select"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 700 }}
                  >
                    {[5, 6, 7, 8, 9].map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00 AM</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Cierra:</span>
                  <select
                    value={workSchedule.closeHour}
                    disabled={isSavingSchedule}
                    onChange={(e) => handleSaveWorkSchedule({ ...workSchedule, closeHour: Number(e.target.value) })}
                    className="form-select"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 700 }}
                  >
                    {[18, 19, 20, 21, 22].map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00 ({h - 12}:00 PM)</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isSavingSchedule}
                  onClick={() => handleSaveWorkSchedule({ ...workSchedule, enabled: !workSchedule.enabled })}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: 'none',
                    background: workSchedule.enabled ? '#0f172a' : '#FF8C00',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {workSchedule.enabled ? 'Pausar Bloqueo' : 'Activar Bloqueo 7-7'}
                </button>
              </div>
            </div>
          </div>

          {/* Security & Automatic SQLite Backups Card */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Protección Activa & Respaldos Automáticos ({backups.length})
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {backups[0]
                      ? `Último respaldo: ${backups[0].filename} (${backups[0].size_kb} KB)`
                      : 'Respaldos programados cada 6 horas en server/data/backups'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAuditLogs(prev => !prev)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-dark-card)',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  {showAuditLogs ? 'Ocultar Auditoría' : `Auditoría (${auditLogs.length})`}
                </button>
                <button
                  type="button"
                  disabled={isCreatingBackup}
                  onClick={handleCreateBackupNow}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {isCreatingBackup ? 'Respaldando...' : 'Crear Respaldo Ahora'}
                </button>
              </div>
            </div>

            {showAuditLogs && (
              <div style={{
                maxHeight: '160px',
                overflowY: 'auto',
                borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                paddingTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '0.7rem'
              }}>
                {auditLogs.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>Sin eventos registrados todavía.</span>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: 'var(--text-muted)' }}>
                      <span>
                        <strong style={{ color: log.action.includes('FAIL') || log.action.includes('LOCK') ? '#fb7185' : 'var(--text-main)' }}>
                          {log.action}
                        </strong>
                        {' '}— {log.actor_username || log.target || 'sistema'}
                        {log.target && log.actor_username && log.target !== log.actor_username ? ` → ${log.target}` : ''}
                      </span>
                      <span className="mono" style={{ flexShrink: 0 }}>{String(log.created_at || '').slice(0, 19)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Info size={14} color="#FF8C00" style={{ flexShrink: 0 }} />
            <span>Los trabajadores con rol <strong>Ventas</strong> o <strong>Almacén</strong> no tendrán acceso a costos FOB ni márgenes confidenciales.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: '7px 18px',
              fontSize: '0.76rem',
              fontWeight: 700,
              borderRadius: '9px',
              background: '#FF8C00',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
}

