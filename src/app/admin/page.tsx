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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general de la liga 2026</p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-3xl font-bold text-gray-900">{categories?.length || 0}</p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jugadores Activos</p>
              <p className="text-3xl font-bold text-gray-900">{totalPlayers || 0}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fechas Generadas</p>
              <p className="text-3xl font-bold text-gray-900">{totalRounds || 0}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partidos Totales</p>
              <p className="text-3xl font-bold text-gray-900">{totalMatches || 0}</p>
            </div>
            <div className="text-4xl">🎾</div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
          <Link
            href="/admin/categorias/nueva"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
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
                className="border border-gray-200 p-4 rounded-lg hover:border-primary-500 hover:shadow-md transition"
              >
                <h3 className="font-bold text-lg text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-600">Temporada {cat.season_year}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No hay categorías creadas aún</p>
            <Link
              href="/admin/categorias/nueva"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Crear primera categoría →
            </Link>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link
          href="/admin/jugadores"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">👥</div>
            <div>
              <h3 className="font-bold text-gray-900">Gestionar Jugadores</h3>
              <p className="text-sm text-gray-600">Ver, crear y editar jugadores</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/fixture"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">📅</div>
            <div>
              <h3 className="font-bold text-gray-900">Generar Fixture</h3>
              <p className="text-sm text-gray-600">Crear fixture de temporada</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/resultados"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">✍️</div>
            <div>
              <h3 className="font-bold text-gray-900">Cargar Resultados</h3>
              <p className="text-sm text-gray-600">Registrar partidos jugados</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
