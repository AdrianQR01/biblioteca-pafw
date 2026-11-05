import React from 'react'

// Componente: select de autores para formularios.
// Recibe autores[], valor actual y onChange.
export default function AutorSelect({ autores, autorId, onChange }) {
  return (
    <div className="field">
      <label htmlFor="autorId">Autor</label>
      <select
        id="autorId"
        name="autorId"
        value={autorId}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">— Selecciona un autor —</option>
        {autores.map((autor) => (
          <option key={autor.id} value={autor.id}>
            {autor.nombre}
          </option>
        ))}
      </select>
    </div>
  )
}
