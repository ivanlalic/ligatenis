import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RoundSelector from '@/components/public/RoundSelector'
import WhatsAppButton from '@/components/public/WhatsAppButton'

// Deshabilitar cache estático - siempre datos frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CategoriaPublicDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { fecha?: string }
}) {
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

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!category) {
    notFound()
  }

  // Obtener tabla de posiciones
  const { data: standings } = await supabase
    .from('standings')
    .select(`
      *,
      player:players(id, first_name, last_name)
    `)
    .eq('category_id', params.id)
    .order('position', { ascending: true })

  // Obtener todas las fechas con información completa
  const { data: allRounds } = await supabase
    .from('rounds')
    .select('id, round_number, period_start, period_end, closed_by_admin_at')
    .eq('category_id', params.id)
    .order('round_number', { ascending: true })

  // Determinar la fecha vigente basado en fechas cerradas
  let currentRoundNumber: number | null = null
  let lastClosedRoundNumber: number | null = null
  let visibleRounds: typeof allRounds = []

  if (allRounds && allRounds.length > 0) {
    // Buscar la última fecha cerrada (mayor round_number con closed_by_admin_at)
    const closedRounds = allRounds.filter(r => r.closed_by_admin_at !== null && r.closed_by_admin_at !== undefined)

    if (closedRounds.length > 0) {
      // Ordenar por round_number y tomar la última
      const sortedClosed = closedRounds.sort((a, b) => b.round_number - a.round_number)
      lastClosedRoundNumber = sortedClosed[0].round_number

      // La fecha vigente es la primera NO cerrada después de la última cerrada
      const firstNotClosed = allRounds.find(r => {
        const isClosed = r.closed_by_admin_at !== null && r.closed_by_admin_at !== undefined
        const isAfterLastClosed = r.round_number > lastClosedRoundNumber!
        return !isClosed && isAfterLastClosed
      })

      if (firstNotClosed) {
        currentRoundNumber = firstNotClosed.round_number
      } else {
        // Si todas están cerradas, la vigente es la última
        currentRoundNumber = lastClosedRoundNumber
      }
    } else {
      // Si no hay ninguna cerrada, la vigente es la primera
      currentRoundNumber = allRounds[0].round_number
    }

    // Filtrar fechas visibles: TODAS las cerradas + la vigente
    visibleRounds = allRounds.filter(round => {
      const isClosed = round.closed_by_admin_at !== null && round.closed_by_admin_at !== undefined
      const isCurrent = round.round_number === currentRoundNumber
      return isClosed || isCurrent
    })
  }

  // Determinar qué fecha mostrar
  const selectedRoundNumber = searchParams.fecha
    ? parseInt(searchParams.fecha)
    : currentRoundNumber

  // Obtener la fecha seleccionada con sus partidos
  const { data: selectedRound } = selectedRoundNumber
    ? await supabase
        .from('rounds')
        .select(`
          *,
          matches (
            *,
            player1:players!matches_player1_id_fkey(id, first_name, last_name, phone),
            player2:players!matches_player2_id_fkey(id, first_name, last_name, phone),
            winner:players!matches_winner_id_fkey(id, first_name, last_name, phone)
          )
        `)
        .eq('category_id', params.id)
        .eq('round_number', selectedRoundNumber)
        .single()
    : { data: null }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-4 md:py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/categorias"
              className="text-sm hover:underline opacity-90"
            >
              ← Volver
            </Link>
            {isPlayer ? (
              <Link
                href="/jugador/dashboard"
                className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-primary-900 rounded-lg hover:bg-gray-100 transition text-xs md:text-sm font-medium shadow-sm"
              >
                Mis Partidos
              </Link>
            ) : (
              <Link
                href="/jugador/login"
                className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-primary-900 rounded-lg hover:bg-gray-100 transition text-xs md:text-sm font-medium shadow-sm"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">{category.name}</h1>
            <p className="text-celeste-300 mt-1 text-sm md:text-base">Temporada {category.season_year}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content - Fixture */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-heading font-bold text-primary-900">
                  Fixture
                </h2>
                <RoundSelector
                  rounds={visibleRounds || []}
                  selectedRoundNumber={selectedRoundNumber}
                />
              </div>

              {selectedRound ? (
                <div>
                  {/* Round info */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-heading font-bold text-primary-900 mb-2">
                      Fecha {selectedRound.round_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📅 Del{' '}
                      {new Date(selectedRound.period_start + 'T00:00:00').toLocaleDateString('es-AR')}{' '}
                      al{' '}
                      {new Date(selectedRound.period_end + 'T00:00:00').toLocaleDateString('es-AR')}
                    </p>
                    {selectedRound.closed_by_admin_at && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        ✅ Fecha cerrada
                      </p>
                    )}
                  </div>

                  {/* Matches */}
                  <div className="space-y-3">
                    {selectedRound.matches && selectedRound.matches.length > 0 ? (
                      selectedRound.matches.map((match: any) => (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-lg p-3 md:p-4 hover:border-primary-300 transition-all duration-200"
                        >
                          <div className="space-y-2">
                            {/* Sin resultado - formato compacto */}
                            {!match.winner_id && !match.is_not_reported && (
                              <div className="text-center text-sm font-medium text-gray-900">
                                {match.player1?.last_name}, {match.player1?.first_name}
                                <WhatsAppButton
                                  phone={match.player1?.phone}
                                  playerName={`${match.player1?.last_name}, ${match.player1?.first_name}`}
                                />
                                {' '}vs{' '}
                                {match.player2?.last_name}, {match.player2?.first_name}
                                <WhatsAppButton
                                  phone={match.player2?.phone}
                                  playerName={`${match.player2?.last_name}, ${match.player2?.first_name}`}
                                />
                              </div>
                            )}

                            {/* Con resultado - formato tabla clásica */}
                            {match.winner_id && !match.is_walkover && (
                              <div className="space-y-1">
                                {/* Player 1 */}
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`flex-1 text-sm font-medium ${
                                      match.winner_id === match.player1_id
                                        ? 'text-green-700 font-bold'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {match.player1?.last_name}, {match.player1?.first_name}
                                    {match.winner_id === match.player1_id && ' 🏆'}
                                    <WhatsAppButton
                                      phone={match.player1?.phone}
                                      playerName={`${match.player1?.last_name}, ${match.player1?.first_name}`}
                                    />
                                  </div>
                                  <div className="flex gap-3 font-mono text-sm min-w-[120px] justify-end">
                                    <span className="w-8 text-center">{match.set1_player1_games}</span>
                                    <span className="w-8 text-center">{match.set2_player1_games}</span>
                                    <span className="w-8 text-center">
                                      {match.set3_player1_games !== null
                                        ? match.set3_player1_games
                                        : ''}
                                    </span>
                                  </div>
                                </div>
                                {/* Player 2 */}
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`flex-1 text-sm font-medium ${
                                      match.winner_id === match.player2_id
                                        ? 'text-green-700 font-bold'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {match.player2?.last_name}, {match.player2?.first_name}
                                    {match.winner_id === match.player2_id && ' 🏆'}
                                    <WhatsAppButton
                                      phone={match.player2?.phone}
                                      playerName={`${match.player2?.last_name}, ${match.player2?.first_name}`}
                                    />
                                  </div>
                                  <div className="flex gap-3 font-mono text-sm min-w-[120px] justify-end">
                                    <span className="w-8 text-center">{match.set1_player2_games}</span>
                                    <span className="w-8 text-center">{match.set2_player2_games}</span>
                                    <span className="w-8 text-center">
                                      {match.set3_player2_games !== null
                                        ? match.set3_player2_games
                                        : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* WO */}
                            {match.is_walkover && (
                              <div className="text-center space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {match.player1?.last_name}, {match.player1?.first_name}
                                  <WhatsAppButton
                                    phone={match.player1?.phone}
                                    playerName={`${match.player1?.last_name}, ${match.player1?.first_name}`}
                                  />
                                  {' '}vs{' '}
                                  {match.player2?.last_name}, {match.player2?.first_name}
                                  <WhatsAppButton
                                    phone={match.player2?.phone}
                                    playerName={`${match.player2?.last_name}, ${match.player2?.first_name}`}
                                  />
                                </div>
                                <div className="text-sm text-orange-600 font-bold">
                                  🚫 WO - Gana {match.winner?.last_name}, {match.winner?.first_name}
                                </div>
                                {match.walkover_reason && (
                                  <div className="text-xs text-gray-500">
                                    Motivo: {match.walkover_reason}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Not reported */}
                            {match.is_not_reported && (
                              <div className="text-center space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {match.player1?.last_name}, {match.player1?.first_name}
                                  <WhatsAppButton
                                    phone={match.player1?.phone}
                                    playerName={`${match.player1?.last_name}, ${match.player1?.first_name}`}
                                  />
                                  {' '}vs{' '}
                                  {match.player2?.last_name}, {match.player2?.first_name}
                                  <WhatsAppButton
                                    phone={match.player2?.phone}
                                    playerName={`${match.player2?.last_name}, ${match.player2?.first_name}`}
                                  />
                                </div>
                                <div className="text-sm text-red-600 font-bold">
                                  ❌ Partido no reportado
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No hay partidos en esta fecha
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-heading font-bold text-primary-900 mb-2">
                    Fixture no generado
                  </h3>
                  <p className="text-gray-600">
                    El fixture aún no ha sido generado para esta categoría
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Standings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 lg:sticky lg:top-8">
              <div className="mb-4">
                <h2 className="text-lg md:text-xl font-heading font-bold text-primary-900">Tabla de Posiciones</h2>
                {lastClosedRoundNumber && (
                  <p className="text-xs text-celeste-500 mt-1">
                    Actualizada a Fecha {lastClosedRoundNumber}
                  </p>
                )}
              </div>

              {standings && standings.length > 0 ? (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="min-w-full">
                    <thead className="bg-primary-900 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">
                          Pos
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">
                          Jugador
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                          PJ
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                          Pts
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                          PG
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                          PP
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase" title="Diferencia de sets">
                          Dif
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standings.map((s) => {
                        const setsDiff = s.sets_won - s.sets_lost
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-mono font-bold text-primary-900">
                              {s.position}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900">
                              {s.player?.last_name}, {s.player?.first_name}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-mono text-gray-900 text-center">
                              {s.matches_played}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-mono font-bold text-primary-900 text-center">
                              {s.points}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-mono text-gray-900 text-center">
                              {s.matches_won}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-mono text-gray-900 text-center">
                              {s.matches_lost}
                            </td>
                            <td
                              className={`px-3 py-3 whitespace-nowrap text-sm font-mono text-center font-medium ${
                                setsDiff > 0
                                  ? 'text-green-600'
                                  : setsDiff < 0
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {setsDiff > 0 ? '+' : ''}
                              {setsDiff}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-sm text-gray-600">
                    La tabla se actualizará al cerrar la primera fecha
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
