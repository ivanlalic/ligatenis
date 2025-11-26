import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Obtener estadísticas
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  const { count: totalPlayers } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalRounds } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })

  const { count: totalMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general de la liga 2026</p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-3xl font-mono font-bold text-primary-900">{categories?.length || 0}</p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jugadores Activos</p>
              <p className="text-3xl font-mono font-bold text-primary-900">{totalPlayers || 0}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fechas Generadas</p>
              <p className="text-3xl font-mono font-bold text-primary-900">{totalRounds || 0}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partidos Totales</p>
              <p className="text-3xl font-mono font-bold text-primary-900">{totalMatches || 0}</p>
            </div>
            <div className="text-4xl">🎾</div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold text-primary-900">Categorías</h2>
          <Link
            href="/admin/categorias/nueva"
            className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition shadow-sm"
          >
            + Nueva Categoría
          </Link>
        </div>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/categorias/${cat.id}`}
                className="border-2 border-gray-200 p-4 rounded-lg hover:border-primary-900 hover:shadow-md transition group"
              >
                <h3 className="font-heading font-bold text-lg text-gray-900 group-hover:text-primary-900 transition">{cat.name}</h3>
                <p className="text-sm text-celeste-500">Temporada {cat.season_year}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No hay categorías creadas aún</p>
            <Link
              href="/admin/categorias/nueva"
              className="text-primary-900 hover:text-celeste-500 font-medium transition"
            >
              Crear primera categoría →
            </Link>
          </div>
        )}
      </div>

      {/* Acceso rápido */}
      <div className="mt-8">
        <Link
          href="/admin/jugadores"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-primary-900 transition group block"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">👥</div>
            <div>
              <h3 className="font-heading font-bold text-gray-900 group-hover:text-primary-900 transition">Gestionar Jugadores</h3>
              <p className="text-sm text-gray-600">Ver, crear y editar jugadores de todas las categorías</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
