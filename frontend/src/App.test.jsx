import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as api from './services/api'

vi.mock('./services/api', () => ({
  obtenerAutores: vi.fn(),
  obtenerLibros: vi.fn(),
  obtenerLibro: vi.fn(),
  crearLibro: vi.fn(),
  actualizarLibro: vi.fn(),
  eliminarLibro: vi.fn(),
  guardarApiKey: vi.fn(),
  limpiarApiKey: vi.fn(),
  obtenerApiKey: vi.fn(() => ''),
}))

const AUTORES = [
  { id: 1, nombre: 'Isabel Allende', bio: null },
  { id: 2, nombre: 'Gabriel García Márquez', bio: null },
]

const LIBROS = [
  {
    id: 1,
    titulo: 'La casa de los espíritus',
    descripcion: 'Novela familiar',
    anioPublicacion: 1982,
    autorId: 1,
    autor: AUTORES[0],
    leido: true,
    puntuacion: 9,
  },
  {
    id: 2,
    titulo: 'Cien años de soledad',
    descripcion: 'Realismo mágico',
    anioPublicacion: 1967,
    autorId: 2,
    autor: AUTORES[1],
    leido: false,
    puntuacion: 10,
  },
]

function prepararCargaCorrecta() {
  api.obtenerAutores.mockResolvedValue(AUTORES)
  api.obtenerLibros.mockResolvedValue(LIBROS)
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  window.confirm = vi.fn(() => true)
})

describe('App', () => {
  it('carga los datos reales y pinta un <li> por libro con key = id', async () => {
    prepararCargaCorrecta()
    render(<App />)

    await screen.findByText('La casa de los espíritus')

    const lista = screen.getByRole('list')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Isabel Allende · 1982')).toBeTruthy()
  })

  it('si el backend no responde muestra un mensaje legible y no rompe la pantalla', async () => {
    api.obtenerAutores.mockRejectedValue(
      new Error('No se pudo conectar con el servidor. Comprueba que el backend está arrancado.')
    )
    api.obtenerLibros.mockRejectedValue(
      new Error('No se pudo conectar con el servidor. Comprueba que el backend está arrancado.')
    )

    render(<App />)

    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).toMatch(/No se pudo conectar con el servidor/)
    // La interfaz sigue viva: el formulario y el botón de reintento están presentes.
    expect(screen.getByLabelText('Título')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('crea un libro con los tipos convertidos y lo añade a la lista', async () => {
    prepararCargaCorrecta()
    const creado = {
      id: 3,
      titulo: 'Nuevo libro',
      descripcion: null,
      anioPublicacion: 2020,
      autorId: 2,
      autor: AUTORES[1],
      leido: false,
      puntuacion: 6,
    }
    api.crearLibro.mockResolvedValue(creado)

    render(<App />)
    await screen.findByText('La casa de los espíritus')

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo libro' } })
    fireEvent.change(screen.getByLabelText('Autor'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Año de publicación'), { target: { value: '2020' } })
    fireEvent.change(screen.getByLabelText('Puntuación (0-10)'), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear libro' }))

    await screen.findByText('Nuevo libro')
    expect(api.crearLibro).toHaveBeenCalledWith({
      titulo: 'Nuevo libro',
      descripcion: null,
      anioPublicacion: 2020,
      autorId: 2,
      leido: false,
      puntuacion: 6,
    })
    // El formulario se reinicia tras guardar.
    expect(screen.getByLabelText('Título').value).toBe('')
  })

  it('al editar otro libro el formulario carga sus datos, no los del anterior', async () => {
    prepararCargaCorrecta()
    render(<App />)
    await screen.findByText('La casa de los espíritus')

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    expect(screen.getByLabelText('Título').value).toBe('La casa de los espíritus')

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[1])
    expect(screen.getByLabelText('Título').value).toBe('Cien años de soledad')
    expect(screen.getByLabelText('Autor').value).toBe('2')
  })

  it('actualiza la lista tras un PATCH sin recargar la página', async () => {
    prepararCargaCorrecta()
    api.actualizarLibro.mockResolvedValue({ ...LIBROS[0], leido: false, puntuacion: 4 })

    render(<App />)
    await screen.findByText('La casa de los espíritus')

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    fireEvent.change(screen.getByLabelText('Puntuación (0-10)'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(screen.getByText(/⏳ Pendiente · ⭐ 4\/10/)).toBeTruthy()
    })
    expect(api.actualizarLibro).toHaveBeenCalledWith(1, expect.objectContaining({ puntuacion: 4 }))
  })

  it('elimina un libro de la lista tras el DELETE', async () => {
    prepararCargaCorrecta()
    api.eliminarLibro.mockResolvedValue({ message: 'Libro eliminado', id: 2 })

    render(<App />)
    await screen.findByText('Cien años de soledad')

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[1])

    await waitFor(() => {
      expect(screen.queryByText('Cien años de soledad')).toBeNull()
    })
    expect(api.eliminarLibro).toHaveBeenCalledWith(2)
  })

  it('filtra por título, por autor y por estado', async () => {
    prepararCargaCorrecta()
    render(<App />)
    await screen.findByText('La casa de los espíritus')

    fireEvent.change(screen.getByLabelText('Buscar por título'), { target: { value: 'soledad' } })
    expect(screen.queryByText('La casa de los espíritus')).toBeNull()
    expect(screen.getByText('Cien años de soledad')).toBeTruthy()
    expect(screen.getByText('1 de 2 libros')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('2 de 2 libros')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'leidos' } })
    expect(screen.getByText('La casa de los espíritus')).toBeTruthy()
    expect(screen.queryByText('Cien años de soledad')).toBeNull()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'todos' } })
    fireEvent.change(screen.getByLabelText('Filtrar por autor'), { target: { value: '2' } })
    expect(screen.getByText('Cien años de soledad')).toBeTruthy()
    expect(screen.queryByText('La casa de los espíritus')).toBeNull()
  })

  it('un error 401 al crear se muestra como aviso y no borra la lista', async () => {
    prepararCargaCorrecta()
    api.crearLibro.mockRejectedValue(new Error('API key incorrecta'))

    render(<App />)
    await screen.findByText('La casa de los espíritus')

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Sin clave' } })
    fireEvent.change(screen.getByLabelText('Autor'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear libro' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).toMatch(/API key incorrecta/)
    expect(screen.getByText('La casa de los espíritus')).toBeTruthy()
    expect(screen.getByLabelText('Título').value).toBe('Sin clave')
  })
})
