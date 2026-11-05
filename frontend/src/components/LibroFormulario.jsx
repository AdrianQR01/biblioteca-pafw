import React from 'react'
import AutorSelect from './AutorSelect'

// Componente: formulario controlado para crear y editar libros (R10, R11).
// · En alta inicializa el estado vacío; en edición, con el libro recibido.
// · App lo remonta con una `key` distinta para que los valores no se queden pegados.
export default function LibroFormulario({ autores, libroInicial, onEnviar, onCancelar, guardando }) {
  const esEdicion = Boolean(libroInicial)

  const [form, setForm] = React.useState({
    titulo: libroInicial?.titulo ?? '',
    descripcion: libroInicial?.descripcion ?? '',
    anioPublicacion: libroInicial?.anioPublicacion ?? '',
    autorId: libroInicial?.autorId ? String(libroInicial.autorId) : '',
    leido: Boolean(libroInicial?.leido),
    puntuacion: libroInicial?.puntuacion ?? '',
  })

  function actualizar(campo, valor) {
    // Nunca se muta el objeto de estado: se reemplaza por uno nuevo (R6).
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Conversión explícita de tipos: los inputs siempre devuelven string (R10).
    const datos = {
      titulo: String(form.titulo || '').trim(),
      descripcion: form.descripcion ? String(form.descripcion).trim() : null,
      anioPublicacion: form.anioPublicacion === '' ? null : Number(form.anioPublicacion),
      autorId: Number(form.autorId),
      leido: Boolean(form.leido),
      puntuacion: form.puntuacion === '' ? null : Number(form.puntuacion),
    }

    onEnviar(datos, libroInicial?.id)
  }

  const sinAutores = autores.length === 0

  return (
    <form className="formulario" onSubmit={handleSubmit}>
      <h3>{esEdicion ? `Editar «${libroInicial.titulo}»` : 'Nuevo libro'}</h3>

      <div className="form-row">
        <div className="field crece">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            value={form.titulo}
            onChange={(e) => actualizar('titulo', e.target.value)}
            required
            minLength={1}
            maxLength={200}
          />
        </div>

        <AutorSelect
          autores={autores}
          autorId={form.autorId}
          onChange={(valor) => actualizar('autorId', valor)}
        />
      </div>

      <div className="form-row">
        <div className="field crece">
          <label htmlFor="descripcion">Descripción</label>
          <input
            id="descripcion"
            name="descripcion"
            type="text"
            value={form.descripcion}
            onChange={(e) => actualizar('descripcion', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="anioPublicacion">Año de publicación</label>
          <input
            id="anioPublicacion"
            name="anioPublicacion"
            type="number"
            inputMode="numeric"
            value={form.anioPublicacion}
            onChange={(e) => actualizar('anioPublicacion', e.target.value)}
            min={0}
            max={2100}
          />
        </div>

        <div className="field">
          <label htmlFor="puntuacion">Puntuación (0-10)</label>
          <input
            id="puntuacion"
            name="puntuacion"
            type="number"
            inputMode="numeric"
            value={form.puntuacion}
            onChange={(e) => actualizar('puntuacion', e.target.value)}
            min={0}
            max={10}
          />
        </div>
      </div>

      <div className="form-row fila-check">
        <label className="check">
          <input
            id="leido"
            name="leido"
            type="checkbox"
            checked={form.leido}
            onChange={(e) => actualizar('leido', e.target.checked)}
          />
          <span>Leído</span>
        </label>
      </div>

      {sinAutores && (
        <p className="ayuda error-texto">
          No hay autores cargados: no se puede guardar un libro hasta recuperar los datos.
        </p>
      )}

      <div className="form-row acciones-form">
        <button type="submit" disabled={guardando || sinAutores}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear libro'}
        </button>
        {esEdicion && (
          <button type="button" className="secondary" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
