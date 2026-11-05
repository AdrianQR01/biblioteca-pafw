import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { actualizarLibro, crearLibro, eliminarLibro, obtenerLibros } from './api'

function respuestaFalsa({ ok, status = 200, cuerpo = '' }) {
  return {
    ok,
    status,
    statusText: 'Fallo simulado',
    text: async () => cuerpo,
  }
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('servicio de API', () => {
  it('traduce un fallo de red a un mensaje comprensible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(obtenerLibros()).rejects.toThrow(/No se pudo conectar con el servidor/)

    vi.unstubAllGlobals()
  })

  it('propaga el mensaje de error del backend cuando la respuesta no es correcta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuestaFalsa({ ok: false, status: 401, cuerpo: JSON.stringify({ error: 'API key incorrecta' }) })
      )
    )

    await expect(crearLibro({ titulo: 'X', autorId: 1 })).rejects.toThrow('API key incorrecta')

    vi.unstubAllGlobals()
  })

  it('envía la cabecera X-Api-Key cuando hay clave en sessionStorage (R18)', async () => {
    sessionStorage.setItem('biblioteca.apiKey', 'clave-de-prueba')
    const fetchMock = vi.fn().mockResolvedValue(respuestaFalsa({ ok: true, cuerpo: '[]' }))
    vi.stubGlobal('fetch', fetchMock)

    await eliminarLibro(7)

    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.method).toBe('DELETE')
    expect(opciones.headers['X-Api-Key']).toBe('clave-de-prueba')

    vi.unstubAllGlobals()
  })

  it('usa PATCH y envía solo el cuerpo indicado al actualizar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuestaFalsa({ ok: true, cuerpo: '{}' }))
    vi.stubGlobal('fetch', fetchMock)

    await actualizarLibro(3, { leido: true })

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/libros/3')
    expect(opciones.method).toBe('PATCH')
    expect(JSON.parse(opciones.body)).toEqual({ leido: true })

    vi.unstubAllGlobals()
  })
})
