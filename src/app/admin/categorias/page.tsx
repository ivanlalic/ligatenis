import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CategoriasPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  // Contar jugadores por categoría
  const categoriesWithCounts = await Promise.all(
    (categories || []).map(async (cat) => {
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('current_category_id', cat.id)
        .eq('status', 'active')

      return { ...cat, playerCount: count || 0 }
    })
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-1">Gestiona las categorías de la liga</p>
        </div>
        <Link
          href="/admin/categorias/nueva"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          + Nueva Categoría
        </Link>
      </div>

      {categoriesWithCounts.length > 0 ? (
        <div className="grid gap-4">
          {categoriesWithCounts.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{cat.name}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>📅 Temporada {cat.season_year}</span>
                    <span>👥 {cat.playerCount} jugadores</span>
                    <span>📊 Orden: {cat.display_order}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/categorias/${cat.id}`}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Ver Detalle
                  </Link>
                  <Link
                    href={`/admin/categorias/${cat.id}/editar`}
                    className="px-4 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition"
                  >
                    ✏️ Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay categorías creadas
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primera categoría para comenzar a organizar la liga
          </p>
          <Link
            href="/admin/categorias/nueva"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Crear Primera Categoría
          </Link>
        </div>
      )}
    </div>
  )
}
