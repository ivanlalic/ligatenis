'use client'

import { useRouter } from 'next/navigation'

export default function PlayerFilters({
  categories,
  currentCategoria,
  currentEstado,
}: {
  categories: Array<{ id: string; name: string }>
  currentCategoria?: string
  currentEstado?: string
}) {
  const router = useRouter()

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('categoria', value)
    if (currentEstado) params.set('estado', currentEstado)
    router.push(`/admin/jugadores?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams()
    if (currentCategoria) params.set('categoria', currentCategoria)
    if (value) params.set('estado', value)
    router.push(`/admin/jugadores?${params.toString()}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={currentCategoria || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={currentEstado || 'active'}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            &nbsp;
          </label>
          <button
            onClick={() => router.push('/admin/jugadores')}
            className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}
