import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { deleteCategory } from '@/app/actions/categories'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'

export default async function CategoriaDetailPage({
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

  // Contar jugadores
  const { count: playerCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('current_category_id', params.id)
    .eq('status', 'active')

  // Contar fechas generadas
  const { count: roundsCount } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', params.id)

  // Contar partidos
  const { count: matchesCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', params.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/categorias"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            ← Volver a Categorías
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          <p className="text-gray-600 mt-1">Temporada {category.season_year}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/categorias/${params.id}/editar`}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            ✏️ Editar
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jugadores Activos</p>
              <p className="text-3xl font-bold text-gray-900">{playerCount || 0}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fechas Generadas</p>
              <p className="text-3xl font-bold text-gray-900">{roundsCount || 0}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partidos Totales</p>
              <p className="text-3xl font-bold text-gray-900">{matchesCount || 0}</p>
            </div>
            <div className="text-4xl">🎾</div>
          </div>
        </div>
      </div>

      {/* Información */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Información</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1 text-lg text-gray-900">{category.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Temporada</dt>
            <dd className="mt-1 text-lg text-gray-900">{category.season_year}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Orden de Visualización</dt>
            <dd className="mt-1 text-lg text-gray-900">{category.display_order}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Creada el</dt>
            <dd className="mt-1 text-lg text-gray-900">
              {new Date(category.created_at).toLocaleDateString('es-AR')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href={`/admin/jugadores?categoria=${params.id}`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">👥</div>
            <div>
              <h3 className="font-bold text-gray-900">Ver Jugadores</h3>
              <p className="text-sm text-gray-600">
                {playerCount || 0} jugadores en esta categoría
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/admin/fixture?categoria=${params.id}`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">📅</div>
            <div>
              <h3 className="font-bold text-gray-900">Generar Fixture</h3>
              <p className="text-sm text-gray-600">
                {roundsCount ? `${roundsCount} fechas generadas` : 'Crear fixture de temporada'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Zona de peligro */}
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-red-900 mb-2">Zona de Peligro</h3>
        <p className="text-sm text-red-700 mb-4">
          Eliminar esta categoría borrará también todos los jugadores, fechas y partidos asociados.
          Esta acción no se puede deshacer.
        </p>
        <DeleteCategoryButton
          categoryId={params.id}
          categoryName={category.name}
          deleteAction={deleteCategory}
        />
      </div>
    </div>
  )
}
