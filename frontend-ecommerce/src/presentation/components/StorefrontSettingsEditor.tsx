import { Badge, Box, Button, Heading, HStack, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import type { StorefrontSettings } from '@domain/entities/StorefrontSettings'

interface OptionEditorProps {
  label: string
  options: string[]
  onChange: (options: string[]) => void
}

function OptionEditor({ label, options, onChange }: OptionEditorProps) {
  const [value, setValue] = useState('')

  function addOption() {
    const option = value.trim()
    if (!option || options.some((entry) => entry.toLowerCase() === option.toLowerCase())) return
    onChange([...options, option])
    setValue('')
  }

  return (
    <Stack gap={2}>
      <Text fontWeight="semibold">{label}</Text>
      <HStack>
        <Input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            addOption()
          }
        }} />
        <Button onClick={addOption}>Agregar</Button>
      </HStack>
      <HStack wrap="wrap">
        {options.map((option) => (
          <Badge key={option} px={2} py={1} colorPalette="teal">
            {option}
            <Button ml={1} size="2xs" variant="plain" aria-label={`Quitar ${option}`} onClick={() => onChange(options.filter((entry) => entry !== option))}>×</Button>
          </Badge>
        ))}
      </HStack>
    </Stack>
  )
}

interface StorefrontSettingsEditorProps {
  settings: StorefrontSettings
  isSaving: boolean
  onChange: (settings: StorefrontSettings) => void
  onSave: () => void
}

export function StorefrontSettingsEditor({ settings, isSaving, onChange, onSave }: StorefrontSettingsEditorProps) {
  const banner = settings.promoBanner

  return (
    <Stack gap={6} bg="white" border="1px solid" borderColor="blackAlpha.200" borderRadius="lg" p={5}>
      <Box>
        <Heading size="md">Opciones de producto</Heading>
        <Text color="#64748b" fontSize="sm">Estos valores alimentan los selectores al crear o editar productos.</Text>
      </Box>
      <OptionEditor label="Colores" options={settings.catalogOptions.colors} onChange={(colors) => onChange({ ...settings, catalogOptions: { ...settings.catalogOptions, colors } })} />
      <OptionEditor label="Tallas" options={settings.catalogOptions.sizes} onChange={(sizes) => onChange({ ...settings, catalogOptions: { ...settings.catalogOptions, sizes } })} />

      <Box borderTop="1px solid" borderColor="#e2e8f0" pt={5}>
        <Heading size="md">Banner de ofertas</Heading>
      </Box>
      <Button width="fit-content" variant={banner.enabled ? 'solid' : 'outline'} onClick={() => onChange({ ...settings, promoBanner: { ...banner, enabled: !banner.enabled } })}>
        {banner.enabled ? 'Visible' : 'Oculto'}
      </Button>
      <Input aria-label="Antetitulo del banner" value={banner.eyebrow} onChange={(event) => onChange({ ...settings, promoBanner: { ...banner, eyebrow: event.target.value } })} />
      <Input aria-label="Titulo del banner" value={banner.title} onChange={(event) => onChange({ ...settings, promoBanner: { ...banner, title: event.target.value } })} />
      <Textarea aria-label="Contenido del banner" value={banner.content} onChange={(event) => onChange({ ...settings, promoBanner: { ...banner, content: event.target.value } })} />
      <Input aria-label="Imagen del banner" placeholder="https://..." value={banner.imageUrl} onChange={(event) => onChange({ ...settings, promoBanner: { ...banner, imageUrl: event.target.value } })} />
      <Input aria-label="Texto del boton del banner" value={banner.ctaLabel} onChange={(event) => onChange({ ...settings, promoBanner: { ...banner, ctaLabel: event.target.value } })} />
      <Button width="fit-content" bg="#0f766e" color="white" loading={isSaving} onClick={onSave}>Guardar configuración</Button>
    </Stack>
  )
}