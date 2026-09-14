export function normalizeSlug(value: string): string {
  return Array.from(value.normalize('NFC'))
    .map((character) =>
      character.toLowerCase() === 'ñ'
        ? character
        : character.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    )
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ñ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}