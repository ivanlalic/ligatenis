import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CategoriasPublicPage() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-950 text-white py-6 md:py-8 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-heading font-bold">🎾 Liga de Tenis Plaza Jewell</h1>
              <p className="text-celeste-300 mt-1 text-sm md:text-base">Temporada 2026</p>
            </div>
            <Link
              href="/admin"
              className="px-3 py-2 md:px-4 md:py-2 bg-white text-primary-900 rounded-lg hover:bg-celeste-100 transition text-sm md:text-base font-medium shadow-md"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {categoriesWithCounts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCounts.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.id}`}
                className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow hover:shadow-xl hover:border-primary-900 transition-all duration-300 block group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">🏆</div>
                  <span className="text-sm font-medium text-gray-500">
                    Temporada {cat.season_year}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-3 group-hover:text-primary-900 transition">
                  {cat.name}
                </h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>👥 {cat.playerCount} jugadores</span>
                </div>
                <div className="mt-4 text-primary-900 text-sm font-medium group-hover:underline">
                  Ver fixture y tabla →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">🎾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay categorías disponibles
            </h3>
            <p className="text-gray-600">
              El torneo aún no ha comenzado. Vuelve pronto para ver las categorías.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
