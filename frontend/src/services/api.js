// Servicio de acceso a la API del backend Biblioteca.
// · La URL se toma de VITE_API_URL (R3), con un valor por defecto para desarrollo.
// · Las operaciones protegidas envían la API key guardada en sessionStorage (R18, R19).

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

export const CLAVE_SESION_API_KEY = 'biblioteca.apiKey'

function getHeaders(conJson = true) {
  const headers = {}
  if (conJson) headers['Content-Type'] = 'application/json'

  const apiKey = sessionStorage.getItem(CLAVE_SESION_API_KEY)
  if (apiKey) headers['X-Api-Key'] = apiKey

  return headers
}

async function handleResponse(res) {
  const texto = await res.text()
  let datos = null
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = texto
  }

  if (!res.ok) {
    const mensaje =
      (datos && (datos.error || datos.message)) ||
      `El servidor respondió con un error ${res.status}`
    throw new Error(mensaje)
  }

  return datos
}

// Envuelve fetch para que un fallo de red (backend apagado, DNS, CORS)
// no llegue a la interfaz como "Failed to fetch" sino como algo legible (R17).
async function peticion(ruta, opciones = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${ruta}`, opciones)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(
      'No se pudo conectar con el servidor. Comprueba que el backend está arrancado en ' +
        BASE_URL +
        '.'
    )
  }
  return handleResponse(res)
}

// ===== Autores =====
export function obtenerAutores() {
  return peticion('/autores', { headers: getHeaders(false) })
}

// ===== Libros =====
export function obtenerLibros() {
  return peticion('/libros', { headers: getHeaders(false) })
}

export function obtenerLibro(id) {
  return peticion(`/libros/${id}`, { headers: getHeaders(false) })
}

export function crearLibro(datos) {
  return peticion('/libros', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  })
}

export function actualizarLibro(id, datos) {
  return peticion(`/libros/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  })
}

export function eliminarLibro(id) {
  return peticion(`/libros/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
}

// ===== Sesión (R19) =====
// La clave vive solo en sessionStorage: se borra al cerrar la pestaña y
// nunca se escribe en el código ni en variables VITE_* (R20).
export function guardarApiKey(clave) {
  sessionStorage.setItem(CLAVE_SESION_API_KEY, clave)
}

export function limpiarApiKey() {
  sessionStorage.removeItem(CLAVE_SESION_API_KEY)
}

export function obtenerApiKey() {
  return sessionStorage.getItem(CLAVE_SESION_API_KEY) || ''
}
