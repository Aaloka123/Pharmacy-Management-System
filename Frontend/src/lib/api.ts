const envApiBase =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
    : ''

/**
 * Browser URL for API and uploaded files. In dev, defaults to Spring Boot
 * ({@code http://localhost:8080}) when {@code VITE_API_BASE_URL} is unset.
 */
export function resolveBackendUrl(path: string | null | undefined): string {
  if (path == null || path === '') {
    return ''
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  if (!path.startsWith('/api') && !path.startsWith('/uploads')) {
    return path
  }
  if (envApiBase) {
    return `${envApiBase}${path}`
  }
  if (import.meta.env.DEV) {
    return `http://localhost:8080${path}`
  }
  return path
}
