const moneyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return moneyFormatter.format(value)
}
