import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { deleteCategory } from '@/app/actions/categories'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'
import CategoryTabs from '@/components/admin/CategoryTabs'
import GenerateFixtureButton from '@/components/admin/GenerateFixtureButton'

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

  // Obtener jugadores de esta categoría
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('current_category_id', params.id)
    .order('last_name', { ascending: true })

  const activePlayers = players?.filter(p => p.status === 'active') || []
  const inactivePlayers = players?.filter(p => p.status === 'inactive') || []

  // Contar fechas generadas
  const { count: roundsCount } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', params.id)

  // Obtener rounds para fixture
  const { data: rounds } = await supabase
    .from('rounds')
    .select(`
      *,
      matches (
        *,
        player1:players!matches_player1_id_fkey(id, first_name, last_name),
        player2:players!matches_player2_id_fkey(id, first_name, last_name),
        winner:players!matches_winner_id_fkey(id, first_name, last_name)
      )
    `)
    .eq('category_id', params.id)
    .order('round_number', { ascending: true })

  // Contar partidos
  const { count: matchesCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', params.id)

  // Obtener tabla de posiciones
  const { data: standings } = await supabase
    .from('standings')
    .select(`
      *,
      player:players(id, first_name, last_name)
    `)
    .eq('category_id', params.id)
    .order('position', { ascending: true })

  // Tabs content
  const tabs = [
    {
      label: 'Información',
      icon: 'ℹ️',
      content: (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jugadores Activos</p>
                  <p className="text-3xl font-bold text-gray-900">{activePlayers.length}</p>
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

          {/* Información detallada */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles</h2>
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
      ),
    },
    {
      label: `Jugadores (${players?.length || 0})`,
      icon: '👥',
      content: (
        <div className="space-y-6">
          {/* Jugadores activos */}
          {activePlayers.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Activos ({activePlayers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Jugador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activePlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {player.last_name}, {player.first_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {player.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/admin/jugadores/${player.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Jugadores inactivos */}
          {inactivePlayers.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Inactivos ({inactivePlayers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Jugador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dado de baja
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inactivePlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50 opacity-60">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {player.last_name}, {player.first_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {player.deactivated_at
                            ? new Date(player.deactivated_at).toLocaleDateString('es-AR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/admin/jugadores/${player.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!players || players.length === 0) && (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No hay jugadores en esta categoría
              </h3>
              <p className="text-gray-600 mb-6">
                Agrega jugadores para poder generar el fixture
              </p>
              <Link
                href="/admin/jugadores/nuevo"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Agregar Jugador
              </Link>
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Tabla de Posiciones',
      icon: '📈',
      content: (
        <div>
          {standings && standings.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jugador
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      PJ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      G
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      P
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Pts
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Sets
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Games
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {standings.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {s.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {s.player?.last_name}, {s.player?.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {s.matches_played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {s.matches_won}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {s.matches_lost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 text-center">
                        {s.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {s.sets_won}/{s.sets_lost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {s.games_won}/{s.games_lost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Tabla de posiciones no disponible
              </h3>
              <p className="text-gray-600 mb-6">
                La tabla se generará automáticamente cuando cierres la primera fecha
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      label: `Fixture ${roundsCount ? `(${roundsCount} fechas)` : ''}`,
      icon: '📅',
      content: (
        <div className="space-y-6">
          {rounds && rounds.length > 0 ? (
            rounds.map((round: any) => (
              <div key={round.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Fecha {round.round_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {round.scheduled_date
                        ? new Date(round.scheduled_date).toLocaleDateString('es-AR')
                        : 'Sin fecha asignada'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      round.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : round.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {round.status === 'completed'
                      ? 'Completada'
                      : round.status === 'active'
                      ? 'En curso'
                      : 'Pendiente'}
                  </span>
                </div>
                <div className="p-6">
                  {round.matches && round.matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {round.matches.map((match: any) => (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {match.player1?.last_name}, {match.player1?.first_name}
                              </div>
                              <div className="text-sm text-gray-500">vs</div>
                              <div className="text-sm font-medium text-gray-900">
                                {match.player2?.last_name}, {match.player2?.first_name}
                              </div>
                            </div>
                            {match.winner_id && (
                              <div className="ml-4 text-right">
                                <div className="text-xs text-gray-500">Ganador:</div>
                                <div className="text-sm font-bold text-green-600">
                                  {match.winner?.last_name}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No hay partidos asignados</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Fixture no generado
              </h3>
              <p className="text-gray-600 mb-6">
                {activePlayers.length < 2
                  ? `Necesitas al menos 2 jugadores activos para generar el fixture (actualmente tienes ${activePlayers.length})`
                  : 'Haz clic en "Generar Fixture" arriba para comenzar la temporada'}
              </p>
              {activePlayers.length < 2 && (
                <Link
                  href="/admin/jugadores/nuevo"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Agregar Jugador
                </Link>
              )}
            </div>
          )}
        </div>
      ),
    },
  ]

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
          <GenerateFixtureButton
            categoryId={params.id}
            categoryName={category.name}
            hasFixture={(roundsCount || 0) > 0}
          />
          <Link
            href={`/admin/categorias/${params.id}/editar`}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            ✏️ Editar
          </Link>
        </div>
      </div>

      <CategoryTabs tabs={tabs} />
    </div>
  )
}
