
export const formatDate = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const parseExcelDate = (serial: any): Date | null => {
  if (!serial) return null;
  if (serial instanceof Date) return isNaN(serial.getTime()) ? null : serial;
  
  // Se for número (Serial Excel)
  if (typeof serial === 'number') {
    // Excel base date is 1899-12-30
    const date = new Date((serial - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Se for texto (CSV/String)
  if (typeof serial === 'string') {
    const clean = serial.trim();
    if (!clean) return null;

    // Tentar formato PT: DD/MM/AAAA ou DD-MM-AAAA
    const ptDateMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (ptDateMatch) {
      const day = parseInt(ptDateMatch[1], 10);
      const month = parseInt(ptDateMatch[2], 10) - 1; // JS months are 0-indexed
      const year = parseInt(ptDateMatch[3], 10);
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }

    // Fallback para formato standard ISO ou US
    const d = new Date(serial);
    return isNaN(d.getTime()) ? null : d;
  }
  
  return null;
};
