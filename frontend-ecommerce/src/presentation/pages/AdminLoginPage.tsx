import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { env } from '@infrastructure/config/env'
import { BrandLogo } from '@presentation/components/BrandLogo'
import { clearAdminAuthToken, hasAdminSession, saveAdminAuthToken } from '@shared/utils/adminAuth'

const LOGIN_TIMEOUT_MS = 10_000

interface LoginResponse {
  success: boolean
  data?: {
    token: string
  }
  error?: {
    code?: string
    message?: string
  }
}

function getLoginHttpErrorMessage(status: number, payload: LoginResponse | null): string {
  const backendMessage = payload?.error?.message?.trim()

  if (status === 400) {
    return backendMessage && backendMessage.length > 0
      ? backendMessage
      : 'Solicitud invalida. Verifica usuario y contrasena.'
  }

  if (status === 401) {
    return backendMessage && backendMessage.length > 0
      ? backendMessage
      : 'Credenciales invalidas. Verifica usuario y contrasena.'
  }

  if (status === 403) {
    return 'No tienes permisos para acceder al panel administrativo.'
  }

  if (status === 429) {
    return 'Demasiados intentos de inicio de sesion. Espera un momento e intenta nuevamente.'
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'El servicio de autenticacion no esta disponible temporalmente. Intenta nuevamente en unos minutos.'
  }

  if (status >= 500) {
    return 'Ocurrio un error interno en el servidor. Intenta nuevamente en unos minutos.'
  }

  return backendMessage && backendMessage.length > 0
    ? backendMessage
    : 'No fue posible iniciar sesion en este momento.'
}

function getLoginUnexpectedErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'La solicitud tardo demasiado. Verifica tu conexion e intenta nuevamente.'
  }

  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servicio de autenticacion. Verifica que el backend este activo.'
  }

  return 'No fue posible iniciar sesion en este momento.'
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const hasActiveSession = hasAdminSession()

  async function handleLogin() {
    const normalizedUsername = username.trim()
    const normalizedPassword = password

    if (!normalizedUsername || !normalizedPassword) {
      setErrorMessage('Usuario y contrasena son obligatorios.')
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS)

    try {
      setIsSubmitting(true)
      setErrorMessage('')

      const response = await fetch(`${env.VITE_ADMIN_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword }),
        signal: controller.signal,
      })

      let payload: LoginResponse | null = null
      try {
        payload = (await response.json()) as LoginResponse
      } catch {
        payload = null
      }

      if (!response.ok) {
        setErrorMessage(getLoginHttpErrorMessage(response.status, payload))
        return
      }

      if (!payload?.success || !payload.data?.token) {
        setErrorMessage('Respuesta invalida del servidor de autenticacion. Intenta nuevamente.')
        return
      }

      saveAdminAuthToken(payload.data.token)
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(getLoginUnexpectedErrorMessage(error))
    } finally {
      clearTimeout(timeoutId)
      setIsSubmitting(false)
    }
  }

  return (
    <Box minH="100dvh" className="app-bg" display="flex" alignItems="center">
      <Container maxW="lg" py={8}>
        <Box
          bg="white"
          borderRadius="2xl"
          border="1px solid"
          borderColor="blackAlpha.200"
          boxShadow="xl"
          p={{ base: 5, md: 8 }}
        >
          <VStack align="stretch" gap={4}>
            <Stack gap={1}>
              <BrandLogo size={56} showText />
              <Text letterSpacing="0.14em" fontWeight="bold" textTransform="uppercase" color="#0f766e">
                Admin access
              </Text>
              <Heading size="lg" color="#0f172a">
                Iniciar sesion
              </Heading>
              <Text color="#334155">
                Ingresa tus credenciales para acceder al modulo administrativo.
              </Text>
            </Stack>

            {hasActiveSession ? (
              <Alert.Root status="info" borderRadius="xl" variant="subtle">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>
                    Ya tienes una sesion activa. Puedes continuar al panel o iniciar nuevamente.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            {errorMessage ? (
              <Alert.Root status="error" borderRadius="xl" variant="subtle">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{errorMessage}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            <Input
              placeholder="Usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button
              bg="#0f172a"
              color="white"
              _hover={{ bg: '#1f2937' }}
              loading={isSubmitting}
              onClick={() => void handleLogin()}
              disabled={!username || !password || isSubmitting}
            >
              Entrar
            </Button>

            {hasActiveSession ? (
              <Button
                variant="outline"
                borderColor="#cbd5e1"
                onClick={() => navigate('/admin/dashboard')}
              >
                Continuar con sesion activa
              </Button>
            ) : null}

            <Button
              size="sm"
              variant="ghost"
              color="#475569"
              onClick={() => {
                clearAdminAuthToken()
                setErrorMessage('Sesion local eliminada. Ingresa nuevamente.')
              }}
            >
              Limpiar sesion guardada
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
