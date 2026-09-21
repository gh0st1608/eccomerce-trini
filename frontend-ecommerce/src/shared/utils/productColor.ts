const COLOR_HEX_BY_NAME: Record<string, string> = {
  amarillo: '#eab308',
  arena: '#c2a878',
  azul: '#2563eb',
  'azul marino': '#1e3a5f',
  beige: '#d6c6a5',
  blanco: '#ffffff',
  camel: '#b77945',
  celeste: '#7dd3fc',
  champagne: '#e8d6b3',
  dorado: '#d4a72c',
  grafito: '#4b5563',
  gris: '#94a3b8',
  marron: '#795548',
  morado: '#7e22ce',
  multicolor: '#64748b',
  negro: '#111827',
  plateado: '#a8b0b8',
  rojo: '#dc2626',
  rosado: '#ec4899',
  transparente: '#f8fafc',
  verde: '#16a34a',
  vino: '#722f37',
}

function normalizeColorName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function resolveProductColorHex(name: string, configuredHex?: string): string {
  if (configuredHex && /^#[0-9a-fA-F]{6}$/.test(configuredHex)) {
    return configuredHex
  }

  return COLOR_HEX_BY_NAME[normalizeColorName(name)] ?? '#8b6f5c'
}

export function isPatternColor(name: string): boolean {
  const normalizedName = normalizeColorName(name)
  return ['animal print', 'estampado', 'multicolor', 'print'].some((term) =>
    normalizedName.includes(term),
  )
}