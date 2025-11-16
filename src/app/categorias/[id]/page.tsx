import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RoundSelector from '@/components/public/RoundSelector'

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
    // Buscar fechas cerradas ordenadas
    const closedRounds = allRounds
      .filter(r => r.closed_by_admin_at)
      .sort((a, b) => a.round_number - b.round_number)

    if (closedRounds.length > 0) {
      lastClosedRoundNumber = closedRounds[closedRounds.length - 1].round_number

      // La fecha vigente es la siguiente después de la última cerrada
      const nextRound = allRounds.find(r => r.round_number > lastClosedRoundNumber!)
      if (nextRound) {
        currentRoundNumber = nextRound.round_number
      } else {
        // Si no hay siguiente, la vigente es la última cerrada (torneo terminado)
        currentRoundNumber = lastClosedRoundNumber
      }
    } else {
      // Si no hay fechas cerradas, la vigente es la primera
      currentRoundNumber = allRounds[0].round_number
    }

    // Filtrar fechas visibles: cerradas + vigente (no las futuras después de vigente)
    visibleRounds = allRounds.filter(round => {
      // Incluir si está cerrada o es la vigente
      return round.closed_by_admin_at || round.round_number === currentRoundNumber
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
            player1:players!matches_player1_id_fkey(id, first_name, last_name),
            player2:players!matches_player2_id_fkey(id, first_name, last_name),
            winner:players!matches_winner_id_fkey(id, first_name, last_name)
          )
        `)
        .eq('category_id', params.id)
        .eq('round_number', selectedRoundNumber)
        .single()
    : { data: null }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/categorias"
            className="text-sm hover:underline mb-2 inline-block opacity-90"
          >
            ← Volver a categorías
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🏆</div>
            <div>
              <h1 className="text-4xl font-bold">{category.name}</h1>
              <p className="text-primary-100 mt-1">Temporada {category.season_year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Fixture */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📅 Fixture</h2>
                <RoundSelector
                  rounds={visibleRounds || []}
                  selectedRoundNumber={selectedRoundNumber}
                />
              </div>

              {selectedRound ? (
                <div>
                  {/* Round info */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
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
                  <div className="space-y-4">
                    {selectedRound.matches && selectedRound.matches.length > 0 ? (
                      selectedRound.matches.map((match: any) => (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                        >
                          <div className="space-y-3">
                            {/* Sin resultado - formato compacto */}
                            {!match.winner_id && !match.is_not_reported && (
                              <div className="text-center text-sm font-medium text-gray-900">
                                {match.player1?.last_name}, {match.player1?.first_name} vs{' '}
                                {match.player2?.last_name}, {match.player2?.first_name}
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
                                  {match.player1?.last_name}, {match.player1?.first_name} vs{' '}
                                  {match.player2?.last_name}, {match.player2?.first_name}
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
                                  {match.player1?.last_name}, {match.player1?.first_name} vs{' '}
                                  {match.player2?.last_name}, {match.player2?.first_name}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
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
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">📈 Tabla de Posiciones</h2>
                {lastClosedRoundNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actualizada a Fecha {lastClosedRoundNumber}
                  </p>
                )}
              </div>

              {standings && standings.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Pos
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Jugador
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          PJ
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Pts
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          PG
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          PP
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase" title="Diferencia de sets">
                          Dif.Sets
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standings.map((s) => {
                        const setsDiff = s.sets_won - s.sets_lost
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                              {s.position}
                            </td>
                            <td className="px-2 py-2 text-xs font-medium text-gray-900">
                              {s.player?.last_name}, {s.player?.first_name}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 text-center">
                              {s.matches_played}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs font-bold text-primary-600 text-center">
                              {s.points}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 text-center">
                              {s.matches_won}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 text-center">
                              {s.matches_lost}
                            </td>
                            <td
                              className={`px-2 py-2 whitespace-nowrap text-xs text-center font-medium ${
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
                    La tabla se actualizará cuando se carguen resultados
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
