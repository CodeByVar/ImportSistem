// Formatter utilities for SISCONTROL

export function formatCurrency(amount, currency = 'USD') {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(percent) {
  if (percent === undefined || percent === null || isNaN(percent)) return '0.0%';
  return `${Number(percent).toFixed(1)}%`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(parts[1], 10) - 1];
      const day = parts[2];
      return `${day} ${month} ${year}`;
    }
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
