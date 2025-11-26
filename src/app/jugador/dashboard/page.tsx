import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOutPlayer } from '@/app/actions/auth'
import Link from 'next/link'

export default async function PlayerDashboardPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/jugador/login')
  }

  // Obtener datos del jugador
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select(`
      *,
      current_category:categories!players_current_category_id_fkey(id, name, season_year)
    `)
    .eq('auth_user_id', user.id)
    .single()

  if (playerError || !player) {
    // El usuario no tiene jugador asociado
    await supabase.auth.signOut()
    redirect('/jugador/login?error=' + encodeURIComponent('No tienes acceso como jugador'))
  }

  if (player.status !== 'active') {
    // El jugador está inactivo
    await supabase.auth.signOut()
    redirect('/jugador/login?error=' + encodeURIComponent('Tu cuenta está inactiva'))
  }

  // Obtener estadísticas del jugador
  const { data: standings } = await supabase
    .from('standings')
    .select('*')
    .eq('player_id', player.id)
    .eq('category_id', player.current_category_id)
    .single()

  // Obtener tabla completa de posiciones
  const { data: allStandings } = await supabase
    .from('standings')
    .select(`
      *,
      player:players(id, first_name, last_name)
    `)
    .eq('category_id', player.current_category_id)
    .order('position', { ascending: true })

  // Obtener rondas pasadas y actuales (no futuras)
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('category_id', player.current_category_id)
    .in('status', ['active', 'completed'])
    .order('round_number', { ascending: false })

  // Obtener partidos del jugador en rondas pasadas/actuales
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      round:rounds!inner(id, round_number, period_start, period_end, status),
      player1:players!matches_player1_id_fkey(id, first_name, last_name),
      player2:players!matches_player2_id_fkey(id, first_name, last_name),
      winner:players!matches_winner_id_fkey(id, first_name, last_name)
    `)
    .eq('category_id', player.current_category_id)
    .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
    .in('round.status', ['active', 'completed'])
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-celeste-50 via-white to-primary-50">
      {/* Header */}
      <div className="bg-primary-900 text-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold">
                🎾 Mi Dashboard
              </h1>
              <p className="text-celeste-100 text-sm mt-1">
                {player.first_name} {player.last_name} · {player.current_category?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/categorias"
                className="px-4 py-2 bg-celeste-500 text-white rounded-lg hover:bg-celeste-600 transition font-medium text-sm"
              >
                👀 Otras Ligas
              </Link>
              <form action={signOutPlayer}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-primary-900 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                >
                  Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Info del jugador */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Categoría */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-900 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h2 className="font-heading font-bold text-gray-900">Categoría</h2>
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {player.current_category?.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Temporada {player.current_category?.season_year}
            </p>
          </div>

          {/* Posición */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-900 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏆</span>
              <h2 className="font-heading font-bold text-gray-900">Posición</h2>
            </div>
            <p className="text-2xl font-bold text-celeste-500">
              {standings?.position ? `#${standings.position}` : 'N/A'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {standings?.points || 0} puntos
            </p>
          </div>

          {/* Partidos */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-900 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎯</span>
              <h2 className="font-heading font-bold text-gray-900">Partidos</h2>
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {standings?.matches_won || 0}G - {standings?.matches_lost || 0}P
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {standings?.matches_played || 0} jugados
            </p>
          </div>
        </div>

        {/* Tabla de Posiciones */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-900 mb-8">
          <div className="border-b border-gray-200 bg-primary-900 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-xl font-heading font-bold">📊 Tabla de Posiciones</h2>
            <p className="text-sm text-celeste-100 mt-1">
              {player.current_category?.name}
            </p>
          </div>

          <div className="p-6">
            {allStandings && allStandings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Pos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Jugador
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        PJ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Pts
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        PG
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        PP
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Dif.Sets
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allStandings.map((s: any) => {
                      const setsDiff = s.sets_won - s.sets_lost
                      const isCurrentPlayer = s.player_id === player.id
                      return (
                        <tr key={s.id} className={isCurrentPlayer ? 'bg-celeste-50 font-bold' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                            {s.position}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {s.player.first_name} {s.player.last_name}
                            {isCurrentPlayer && <span className="ml-2 text-celeste-600">(Tú)</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {s.matches_played}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-primary-900">
                            {s.points}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600">
                            {s.matches_won}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-red-600">
                            {s.matches_lost}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-mono ${
                            setsDiff > 0
                              ? 'text-green-600'
                              : setsDiff < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {setsDiff > 0 ? '+' : ''}{setsDiff}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">La tabla se actualizará al cerrar la primera fecha</p>
              </div>
            )}
          </div>
        </div>

        {/* Mis Partidos */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-900">
          <div className="border-b border-gray-200 bg-primary-900 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-xl font-heading font-bold">Mis Partidos</h2>
            <p className="text-sm text-celeste-100 mt-1">
              Partidos de rondas pasadas y actuales
            </p>
          </div>

          <div className="p-6">
            {matches && matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => {
                  const isPlayer1 = match.player1_id === player.id
                  const opponent = isPlayer1 ? match.player2 : match.player1
                  const isWinner = match.winner_id === player.id
                  const hasResult = match.winner_id !== null

                  return (
                    <div
                      key={match.id}
                      className={`border rounded-lg p-4 ${
                        hasResult
                          ? isWinner
                            ? 'border-green-300 bg-green-50'
                            : 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-primary-900 text-white text-xs font-semibold rounded">
                            Fecha {match.round.round_number}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(match.round.period_start).toLocaleDateString('es-AR')} -{' '}
                            {new Date(match.round.period_end).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        {hasResult ? (
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            isWinner ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {isWinner ? '✓ GANADO' : '✗ PERDIDO'}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-200 text-yellow-800">
                            PENDIENTE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className={`font-medium ${isPlayer1 ? 'text-primary-900' : ''}`}>
                          {match.player1.first_name} {match.player1.last_name}
                          {isPlayer1 && ' (Tú)'}
                        </div>
                        <div className={`font-medium ${!isPlayer1 ? 'text-primary-900' : ''}`}>
                          {match.player2.first_name} {match.player2.last_name}
                          {!isPlayer1 && ' (Tú)'}
                        </div>
                      </div>

                      {hasResult && !match.is_walkover && !match.is_bye && (
                        <div className="mt-3 text-sm text-gray-700">
                          <strong>Resultado:</strong>{' '}
                          {match.set1_player1_games !== null && (
                            <>
                              {match.set1_player1_games}-{match.set1_player2_games}
                              {match.set2_player1_games !== null && (
                                <> {match.set2_player1_games}-{match.set2_player2_games}</>
                              )}
                              {match.set3_player1_games !== null && (
                                <> {match.set3_player1_games}-{match.set3_player2_games}</>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {match.is_walkover && (
                        <div className="mt-3 text-sm text-gray-700">
                          <strong>W.O.</strong> - {match.walkover_reason}
                        </div>
                      )}

                      {!hasResult && match.round.status === 'active' && (
                        <div className="mt-4">
                          <Link
                            href={`/jugador/partidos/${match.id}/resultado`}
                            className="inline-block px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition text-sm font-medium"
                          >
                            Cargar Resultado
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🎾</span>
                <p className="text-gray-600">
                  Aún no tienes partidos asignados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
