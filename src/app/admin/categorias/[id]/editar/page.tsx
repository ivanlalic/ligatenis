import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { updateCategory } from '@/app/actions/categories'
import Link from 'next/link'

export default async function EditarCategoriaPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!category) {
    notFound()
  }

  const updateWithId = updateCategory.bind(null, params.id)

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/categorias/${params.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Categoría</h1>
        <p className="text-gray-600 mt-1">Modifica la información de la categoría</p>
      </div>

      <div className="max-w-2xl bg-white p-8 rounded-lg shadow">
        <form action={updateWithId} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={category.name}
              placeholder="Ej: Super A, A, B, C..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Ejemplos: Super A, A, B, C, Primera, Segunda, etc.
            </p>
          </div>

          <div>
            <label htmlFor="season_year" className="block text-sm font-medium text-gray-700 mb-2">
              Año de Temporada *
            </label>
            <input
              type="number"
              id="season_year"
              name="season_year"
              required
              defaultValue={category.season_year}
              min={2020}
              max={2030}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
              Orden de Visualización *
            </label>
            <input
              type="number"
              id="display_order"
              name="display_order"
              required
              defaultValue={category.display_order}
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Define el orden en que aparecerá (1 = primero, 2 = segundo, etc.)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Guardar Cambios
            </button>
            <Link
              href={`/admin/categorias/${params.id}`}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
