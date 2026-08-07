export function applySecurityHeaders(
  headers: Headers | Record<string, string>,
) {
  setHeader(headers, 'X-Content-Type-Options', 'nosniff')
  setHeader(headers, 'X-Frame-Options', 'SAMEORIGIN')
  setHeader(headers, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(headers, 'X-XSS-Protection', '0')
  setHeader(headers, 'Cross-Origin-Opener-Policy', 'same-origin')
  setHeader(headers, 'Cross-Origin-Resource-Policy', 'same-origin')
  setHeader(
    headers,
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
}

function setHeader(
  headers: Headers | Record<string, string>,
  key: string,
  value: string,
) {
  if (headers instanceof Headers) headers.set(key, value)
  else headers[key] = value
}
