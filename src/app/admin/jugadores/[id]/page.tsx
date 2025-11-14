import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { deactivatePlayer, reactivatePlayer } from '@/app/actions/players'
import PlayerActionButtons from '@/components/admin/PlayerActionButtons'

export default async function PlayerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: player } = await supabase
    .from('players')
    .select(`
      *,
      initial_category:categories!players_initial_category_id_fkey(id, name),
      current_category:categories!players_current_category_id_fkey(id, name)
    `)
    .eq('id', params.id)
    .single()

  if (!player) {
    notFound()
  }

  // Obtener estadísticas del jugador
  const { data: standings } = await supabase
    .from('standings')
    .select('*')
    .eq('player_id', params.id)
    .eq('category_id', player.current_category_id)
    .single()

  // Obtener partidos del jugador
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      round:rounds(round_number, period_start, period_end, status),
      player1:players!matches_player1_id_fkey(id, first_name, last_name),
      player2:players!matches_player2_id_fkey(id, first_name, last_name),
      winner:players!matches_winner_id_fkey(id, first_name, last_name)
    `)
    .or(`player1_id.eq.${params.id},player2_id.eq.${params.id}`)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/jugadores"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            ← Volver a Jugadores
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {player.first_name} {player.last_name}
          </h1>
          <p className="text-gray-600 mt-1">
            {player.current_category?.name} • {player.status === 'active' ? 'Activo' : 'Inactivo'}
          </p>
        </div>
        <div className="flex gap-2">
          <PlayerActionButtons
            playerId={params.id}
            playerName={`${player.first_name} ${player.last_name}`}
            isActive={player.status === 'active'}
            deactivateAction={deactivatePlayer}
            reactivateAction={reactivatePlayer}
          />
          <Link
            href={`/admin/jugadores/${params.id}/editar`}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            ✏️ Editar
          </Link>
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Información Personal</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
            <dd className="mt-1 text-lg text-gray-900">{player.first_name} {player.last_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-lg text-gray-900">{player.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-lg text-gray-900">{player.phone || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              {player.status === 'active' ? (
                <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                  Activo
                </span>
              ) : (
                <span className="px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  Inactivo
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Categoría Inicial</dt>
            <dd className="mt-1 text-lg text-gray-900">{player.initial_category?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Categoría Actual</dt>
            <dd className="mt-1 text-lg text-gray-900">{player.current_category?.name}</dd>
          </div>
          {player.deactivated_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Dado de baja el</dt>
              <dd className="mt-1 text-lg text-gray-900">
                {new Date(player.deactivated_at).toLocaleDateString('es-AR')}
              </dd>
            </div>
          )}
          {player.notes && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notas</dt>
              <dd className="mt-1 text-gray-900">{player.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Estadísticas */}
      {standings && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Estadísticas - {player.current_category?.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{standings.position || '-'}</div>
              <div className="text-sm text-gray-600">Posición</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{standings.points}</div>
              <div className="text-sm text-gray-600">Puntos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{standings.matches_played}</div>
              <div className="text-sm text-gray-600">Partidos Jugados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{standings.matches_won}</div>
              <div className="text-sm text-gray-600">Ganados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{standings.matches_lost}</div>
              <div className="text-sm text-gray-600">Perdidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {standings.sets_won}/{standings.sets_lost}
              </div>
              <div className="text-sm text-gray-600">Sets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {standings.games_won}/{standings.games_lost}
              </div>
              <div className="text-sm text-gray-600">Games</div>
            </div>
            {standings.matches_won_by_wo > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{standings.matches_won_by_wo}</div>
                <div className="text-sm text-gray-600">WO Ganados</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Últimos partidos */}
      {matches && matches.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Últimos Partidos</h2>
          <div className="space-y-4">
            {matches.map((match: any) => {
              const isPlayer1 = match.player1_id === params.id
              const opponent = isPlayer1 ? match.player2 : match.player1
              const won = match.winner_id === params.id

              return (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">
                        Fecha {match.round?.round_number} •{' '}
                        {match.round?.period_start
                          ? new Date(match.round.period_start).toLocaleDateString('es-AR')
                          : '-'}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        vs {opponent?.first_name} {opponent?.last_name}
                      </div>
                    </div>
                    <div className="ml-4">
                      {match.winner_id ? (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            won
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {won ? 'Victoria' : 'Derrota'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
