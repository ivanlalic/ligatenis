'use client'

import { useState } from 'react'

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
  deleteAction,
}: {
  categoryId: string
  categoryName: string
  deleteAction: (id: string) => Promise<{ error?: string } | void>
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = confirm(
      `¿Estás seguro de eliminar la categoría "${categoryName}"?\n\nEsta acción eliminará también:\n- Todos los jugadores de esta categoría\n- Todas las fechas generadas\n- Todos los partidos\n\nEsta acción NO se puede deshacer.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    await deleteAction(categoryId)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? '⏳ Eliminando...' : '🗑️ Eliminar Categoría'}
    </button>
  )
}
