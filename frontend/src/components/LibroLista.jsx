import React from 'react'

// Componente: lista de libros (R8, R9).
// Recibe la colección ya filtrada, si el usuario tiene libros en total,
// y las acciones de editar y eliminar.
export default function LibroLista({ libros, hayLibros, onEditar, onEliminar, guardando }) {
  if (libros.length === 0) {
    return (
      <p className="empty">
        {hayLibros
          ? 'Ningún libro coincide con los filtros aplicados.'
          : 'Todavía no hay libros. Crea el primero con el formulario de arriba.'}
      </p>
    )
  }

  return (
    <ul className="lista">
      {libros.map((libro) => (
        <li key={libro.id} className="lista-item">
          <div className="info">
            <strong>{libro.titulo}</strong>
            {libro.descripcion && <span className="meta">{libro.descripcion}</span>}
            <span className="meta">
              {libro.autor?.nombre || `Autor #${libro.autorId}`}
              {libro.anioPublicacion ? ` · ${libro.anioPublicacion}` : ''}
            </span>
            <span className="meta">
              {libro.leido ? '✅ Leído' : '⏳ Pendiente'}
              {libro.puntuacion !== null && libro.puntuacion !== undefined
                ? ` · ⭐ ${libro.puntuacion}/10`
                : ''}
            </span>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => onEditar(libro)} disabled={guardando}>
              Editar
            </button>
            <button type="button" className="danger" onClick={() => onEliminar(libro.id)} disabled={guardando}>
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
