// ============================================================
// SISCONTROL ERP — Sistema de Permisos por Rol
// Centraliza qué pestañas y datos puede ver cada trabajador
// ============================================================

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    defaultTab: 'dashboard',
    allowedTabs: ['dashboard', 'notes', 'inventory', 'weekly', 'movements', 'containers'],
    showCustomers: true,
    showUsersModal: true,
    showImporter: true,
    canSeeCosts: true,       // Ve costos FOB, landed, márgenes
    canSeePrices: true,      // Ve todos los precios (mayor, caja, especial)
    canEditMovements: true,
    canDeleteContainers: true,
    canAddPayments: true,
    inventoryFilter: 'all',  // Ve todos los productos (con y sin stock)
  },
  ADMIN: {
    defaultTab: 'dashboard',
    allowedTabs: ['dashboard', 'notes', 'inventory', 'weekly', 'movements', 'containers'],
    showCustomers: true,
    showUsersModal: false,
    showImporter: true,
    canSeeCosts: true,
    canSeePrices: true,
    canEditMovements: true,
    canDeleteContainers: false,
    canAddPayments: true,
    inventoryFilter: 'all',
  },
  VENTAS: {
    defaultTab: 'dashboard',
    allowedTabs: ['dashboard', 'notes', 'inventory', 'weekly'],
    showCustomers: true,
    showUsersModal: false,
    showImporter: false,
    canSeeCosts: false,      // NO ve costos FOB ni landed
    canSeePrices: true,      // SÍ ve precio mayor, caja, especial
    canEditMovements: false,
    canDeleteContainers: false,
    canAddPayments: true,    // Puede registrar pagos/abonos
    inventoryFilter: 'all',
  },
  ALMACEN: {
    defaultTab: 'notes',
    allowedTabs: ['dashboard', 'notes', 'weekly', 'inventory', 'containers'],
    showCustomers: false,
    showUsersModal: false,
    showImporter: false,
    canSeeCosts: false,      // NO ve costos
    canSeePrices: false,     // NO ve precio caja ni especial — solo precio mayor
    canSeeWholesalePrice: true, // SÍ ve precio por mayor (referencia de valorización)
    canEditMovements: true,
    canDeleteContainers: false,
    canAddPayments: false,
    inventoryFilter: 'instock', // Solo ve productos con stock > 0
  },
  CAJA: {
    defaultTab: 'notes',
    allowedTabs: ['notes', 'weekly'],
    showCustomers: true,
    showUsersModal: false,
    showImporter: false,
    canSeeCosts: false,
    canSeePrices: true,
    canEditMovements: false,
    canDeleteContainers: false,
    canAddPayments: true,
    inventoryFilter: 'all',
  },
};

/**
 * Retorna los permisos del usuario actual.
 * Si el rol no existe, usa los permisos de VENTAS como fallback seguro.
 */
export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.VENTAS;
}

/**
 * Verifica si un tab está permitido para el rol dado.
 */
export function canAccessTab(role, tab) {
  const perms = getPermissions(role);
  return perms.allowedTabs.includes(tab);
}

