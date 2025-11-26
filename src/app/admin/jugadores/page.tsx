import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PlayerFilters from '@/components/admin/PlayerFilters'
import NewPlayerCredentialsModal from '@/components/admin/NewPlayerCredentialsModal'

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: { categoria?: string; estado?: string }
}) {
  const supabase = await createClient()

  // Obtener categorías para el filtro
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  // Construir query de jugadores
  let query = supabase
    .from('players')
    .select(`
      *,
      initial_category:categories!players_initial_category_id_fkey(id, name),
      current_category:categories!players_current_category_id_fkey(id, name)
    `)
    .order('last_name', { ascending: true })

  // Filtrar por categoría si se especifica
  if (searchParams.categoria) {
    query = query.eq('current_category_id', searchParams.categoria)
  }

  // Filtrar por estado si se especifica
  if (searchParams.estado) {
    query = query.eq('status', searchParams.estado)
  } else {
    // Por defecto, mostrar solo activos
    query = query.eq('status', 'active')
  }

  const { data: players } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-900">Jugadores</h1>
          <p className="text-gray-600 mt-1">Gestiona los jugadores de la liga</p>
        </div>
        <Link
          href="/admin/jugadores/nuevo"
          className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition shadow-md"
        >
          + Nuevo Jugador
        </Link>
      </div>

      {/* Filtros */}
      <PlayerFilters
        categories={categories || []}
        currentCategoria={searchParams.categoria}
        currentEstado={searchParams.estado}
      />

      {/* Lista de jugadores */}
      {players && players.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-primary-900">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-900 to-primary-950 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {player.last_name}, {player.first_name}
                    </div>
                    {player.phone && (
                      <div className="text-sm text-gray-500 font-mono">{player.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{player.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-celeste-100 text-celeste-800">
                      {player.current_category?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.status === 'active' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/jugadores/${player.id}`}
                        className="text-celeste-500 hover:text-celeste-600 font-medium"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/jugadores/${player.id}/editar`}
                        className="text-primary-900 hover:text-primary-950 font-medium"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-heading font-bold text-primary-900 mb-2">
            No hay jugadores
          </h3>
          <p className="text-gray-600 mb-6">
            {searchParams.categoria || searchParams.estado
              ? 'No se encontraron jugadores con los filtros aplicados'
              : 'Crea tu primer jugador para comenzar'}
          </p>
          <Link
            href="/admin/jugadores/nuevo"
            className="inline-block px-6 py-3 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition shadow-md"
          >
            Crear Primer Jugador
          </Link>
        </div>
      )}

      {players && players.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Mostrando {players.length} jugador{players.length !== 1 ? 'es' : ''}
        </div>
      )}

      {/* Modal para mostrar credenciales de nuevo jugador */}
      <NewPlayerCredentialsModal />
    </div>
  )
}
