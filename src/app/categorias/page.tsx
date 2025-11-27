import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CategoriasPublicPage() {
  const supabase = await createClient()

  // Verificar si hay un usuario logueado y si es un jugador
  const { data: { user } } = await supabase.auth.getUser()
  let isPlayer = false

  if (user) {
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    isPlayer = !!player
  }

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
      <div className="bg-primary-900 text-white py-4 md:py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">Liga de Tenis • CAR</h1>
              <p className="text-celeste-300 mt-1 text-sm md:text-base">Temporada 2026</p>
            </div>
            {isPlayer ? (
              <Link
                href="/jugador/dashboard"
                className="px-3 py-2 md:px-4 md:py-2 bg-white text-primary-900 rounded-lg hover:bg-gray-100 transition text-sm md:text-base font-medium shadow-sm"
              >
                Mis Partidos
              </Link>
            ) : (
              <Link
                href="/jugador/login"
                className="px-3 py-2 md:px-4 md:py-2 bg-white text-primary-900 rounded-lg hover:bg-gray-100 transition text-sm md:text-base font-medium shadow-sm"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {categoriesWithCounts.length > 0 ? (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCounts.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.id}`}
                className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-900 transition-all duration-200 block group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Temporada {cat.season_year}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-3 group-hover:text-primary-900 transition">
                  {cat.name}
                </h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{cat.playerCount} jugadores</span>
                </div>
                <div className="mt-4 text-primary-900 text-sm font-medium group-hover:underline">
                  Ver fixture y tabla →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
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
