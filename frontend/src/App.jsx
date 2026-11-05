import React from 'react'
import {
  obtenerAutores,
  obtenerLibros,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
  guardarApiKey,
  limpiarApiKey,
  obtenerApiKey,
} from './services/api'
import LibroLista from './components/LibroLista'
import LibroFormulario from './components/LibroFormulario'
import LibroFiltros from './components/LibroFiltros'

const FILTROS_INICIALES = { texto: '', autorId: 'todos', estado: 'todos' }

function filtrarLibros(libros, filtros) {
  const texto = filtros.texto.trim().toLowerCase()

  return libros.filter((libro) => {
    const coincideTexto =
      texto === '' || String(libro.titulo || '').toLowerCase().includes(texto)

    const coincideAutor =
      filtros.autorId === 'todos' || String(libro.autorId) === String(filtros.autorId)

    const coincideEstado =
      filtros.estado === 'todos' ||
      (filtros.estado === 'leidos' && libro.leido === true) ||
      (filtros.estado === 'pendientes' && libro.leido === false)

    return coincideTexto && coincideAutor && coincideEstado
  })
}

export default function App() {
  // Datos de la API
  const [autores, setAutores] = React.useState([])
  const [libros, setLibros] = React.useState([])

  // Estados de la interfaz (separados a propósito: R17)
  const [cargando, setCargando] = React.useState(true) // solo carga inicial / reintento
  const [guardando, setGuardando] = React.useState(false) // escrituras sobre el formulario
  const [errorCarga, setErrorCarga] = React.useState(null) // error que impide tener datos
  const [errorAccion, setErrorAccion] = React.useState(null) // error de una acción puntual
  const [aviso, setAviso] = React.useState(null) // confirmación de éxito

  // Contador que fuerza a repetir la carga inicial
  const [recarga, setRecarga] = React.useState(0)

  // Estado de sesión: la API key vive en sessionStorage (R19)
  const [apiKeyInput, setApiKeyInput] = React.useState(() => obtenerApiKey())
  const [apiKeyGuardada, setApiKeyGuardada] = React.useState(() => Boolean(obtenerApiKey()))

  // Libro en edición (null = alta) y versión para reiniciar el formulario
  const [libroEdicion, setLibroEdicion] = React.useState(null)
  const [formVersion, setFormVersion] = React.useState(0)

  const [filtros, setFiltros] = React.useState(FILTROS_INICIALES)

  // Carga inicial de datos (R7). Depende de `recarga` a propósito: cada vez que
  // se pide reintentar se incrementa y el efecto vuelve a pedir autores y libros.
  React.useEffect(() => {
    let cancelado = false

    async function cargar() {
      setCargando(true)
      setErrorCarga(null)
      try {
        const [autoresData, librosData] = await Promise.all([obtenerAutores(), obtenerLibros()])

        if (cancelado) return
        setAutores(Array.isArray(autoresData) ? autoresData : [])
        setLibros(Array.isArray(librosData) ? librosData : [])
      } catch (err) {
        if (cancelado) return
        setErrorCarga(err.message || 'No se pudieron cargar los datos.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()

    return () => {
      cancelado = true
    }
  }, [recarga])

  // Los avisos de éxito desaparecen solos a los 4 segundos.
  React.useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  const librosFiltrados = filtrarLibros(libros, filtros)

  function handleGuardarApiKey(e) {
    e.preventDefault()
    const clave = String(apiKeyInput || '').trim()
    if (!clave) return
    guardarApiKey(clave)
    setApiKeyGuardada(true)
    setErrorAccion(null)
    setAviso('Clave guardada en esta sesión del navegador.')
  }

  function handleEliminarApiKey() {
    limpiarApiKey()
    setApiKeyGuardada(false)
    setApiKeyInput('')
    setAviso('Clave eliminada de la sesión.')
  }

  function handleCambiarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleEnviarLibro(datos, id) {
    setGuardando(true)
    setErrorAccion(null)
    try {
      if (id) {
        const actualizado = await actualizarLibro(id, datos)
        setLibros((prev) => prev.map((libro) => (libro.id === id ? actualizado : libro)))
        setAviso('Libro actualizado correctamente.')
      } else {
        const nuevo = await crearLibro(datos)
        setLibros((prev) => [...prev, nuevo])
        setAviso('Libro creado correctamente.')
      }
      setLibroEdicion(null)
      setFormVersion((version) => version + 1)
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo guardar el libro.')
    } finally {
      setGuardando(false)
    }
  }

  function handleEditar(libro) {
    setErrorAccion(null)
    setLibroEdicion(libro)
    setFormVersion((version) => version + 1)
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Seguro que quieres eliminar este libro?')) return

    setGuardando(true)
    setErrorAccion(null)
    try {
      await eliminarLibro(id)
      setLibros((prev) => prev.filter((libro) => libro.id !== id))
      if (libroEdicion?.id === id) setLibroEdicion(null)
      setAviso('Libro eliminado.')
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo eliminar el libro.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Biblioteca</h1>
        <p>Gestión de libros y autores consumiendo la API de la Fase 1.</p>
      </header>

      {aviso && (
        <div className="mensaje ok" role="status">
          {aviso}
        </div>
      )}
      {errorAccion && (
        <div className="mensaje error" role="alert">
          {errorAccion}
        </div>
      )}

      <section className="card" aria-labelledby="titulo-api-key">
        <h2 id="titulo-api-key">Clave de sesión</h2>
        <p className="ayuda">
          Las operaciones de escritura están protegidas. La clave se guarda en{' '}
          <strong>sessionStorage</strong> y se envía en la cabecera <code>X-Api-Key</code>.
        </p>

        {apiKeyGuardada ? (
          <div className="form-row">
            <span className="estado-clave">✅ Clave activa en esta pestaña.</span>
            <button
              type="button"
              className="danger"
              onClick={handleEliminarApiKey}
              disabled={guardando}
            >
              Eliminar clave
            </button>
          </div>
        ) : (
          <form onSubmit={handleGuardarApiKey} className="form-row">
            <div className="field crece">
              <label htmlFor="apiKey">Clave de la API</label>
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={guardando}>
              Guardar clave
            </button>
          </form>
        )}
      </section>

      <section className="card" aria-labelledby="titulo-libros">
        <h2 id="titulo-libros">Libros</h2>

        {errorCarga && (
          <div className="mensaje error" role="alert">
            <p>{errorCarga}</p>
            <button
              type="button"
              className="secondary"
              onClick={() => setRecarga((n) => n + 1)}
              disabled={cargando}
            >
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <p className="cargando" role="status">
            Cargando libros y autores…
          </p>
        ) : (
          <>
            <LibroFormulario
              key={`${libroEdicion?.id ?? 'nuevo'}-${formVersion}`}
              autores={autores}
              libroInicial={libroEdicion}
              onEnviar={handleEnviarLibro}
              onCancelar={() => setLibroEdicion(null)}
              guardando={guardando}
            />

            <div className="separador" />

            <LibroFiltros
              filtros={filtros}
              autores={autores}
              onCambiar={handleCambiarFiltro}
              onLimpiar={() => setFiltros(FILTROS_INICIALES)}
              resultados={librosFiltrados.length}
              total={libros.length}
            />

            <LibroLista
              libros={librosFiltrados}
              hayLibros={libros.length > 0}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              guardando={guardando}
            />
          </>
        )}
      </section>

      <footer className="app-footer">
        <p>
          <strong>Biblioteca</strong> · PAFW Fase 3 · Despliegue en Render
        </p>
        <p>
          Backend API: <code>{import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}</code> · Versión: <code>v1.0.0-fase3</code>
        </p>
      </footer>
    </div>
  )
}
