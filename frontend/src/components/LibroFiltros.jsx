import React from 'react'

// Componente: barra de filtros de la lista de libros (sesión 7).
// No guarda estado propio: recibe los filtros y avisa de cada cambio con onCambiar.
export default function LibroFiltros({ filtros, autores, onCambiar, onLimpiar, resultados, total }) {
  return (
    <form className="filtros" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de libros">
      <div className="field">
        <label htmlFor="filtroTexto">Buscar por título</label>
        <input
          id="filtroTexto"
          type="search"
          value={filtros.texto}
          placeholder="Ej. soledad"
          onChange={(e) => onCambiar('texto', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="filtroAutor">Filtrar por autor</label>
        <select
          id="filtroAutor"
          value={filtros.autorId}
          onChange={(e) => onCambiar('autorId', e.target.value)}
        >
          <option value="todos">Todos los autores</option>
          {autores.map((autor) => (
            <option key={autor.id} value={String(autor.id)}>
              {autor.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filtroEstado">Estado</label>
        <select
          id="filtroEstado"
          value={filtros.estado}
          onChange={(e) => onCambiar('estado', e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="leidos">Leídos</option>
          <option value="pendientes">Pendientes</option>
        </select>
      </div>

      <button type="button" className="secondary" onClick={onLimpiar}>
        Limpiar filtros
      </button>

      <p className="contador" role="status">
        {resultados} de {total} libros
      </p>
    </form>
  )
}
