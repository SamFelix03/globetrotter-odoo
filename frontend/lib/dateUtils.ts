/**
 * Format date to dd/mm/yyyy format
 */
export function formatDateDDMMYYYY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format date range to dd/mm/yyyy - dd/mm/yyyy format
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  return `${formatDateDDMMYYYY(startDate)} - ${formatDateDDMMYYYY(endDate)}`
}

