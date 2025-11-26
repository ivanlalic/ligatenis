import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Cron job que se ejecuta diariamente a las 00:05 AM (Argentina)
 * para cerrar automáticamente las rondas cuyo período ha finalizado
 *
 * Si un partido no fue reportado, se penaliza a ambos jugadores:
 * - 1 partido jugado
 * - 0 puntos (ambos pierden)
 */
export async function GET(request: NextRequest) {
  // Verificar autenticación del cron (Vercel incluye este header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  try {
    // Obtener la fecha actual en Argentina (UTC-3)
    const now = new Date()
    const argentinaOffset = -3 * 60 // -3 horas en minutos
    const argentinaTime = new Date(now.getTime() + (argentinaOffset + now.getTimezoneOffset()) * 60000)

    // Formatear fecha para comparación (YYYY-MM-DD)
    const today = argentinaTime.toISOString().split('T')[0]

    console.log(`[CRON] Running auto-close at ${argentinaTime.toISOString()}`)
    console.log(`[CRON] Today in Argentina: ${today}`)

    // Buscar rondas activas cuyo período haya finalizado (period_end < today)
    const { data: expiredRounds, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'active')
      .lt('period_end', today)

    if (roundsError) {
      console.error('[CRON] Error fetching expired rounds:', roundsError)
      return NextResponse.json({ error: roundsError.message }, { status: 500 })
    }

    if (!expiredRounds || expiredRounds.length === 0) {
      console.log('[CRON] No expired rounds found')
      return NextResponse.json({
        success: true,
        message: 'No expired rounds to close',
        closedRounds: 0
      })
    }

    console.log(`[CRON] Found ${expiredRounds.length} expired rounds to close`)

    const results = []

    // Procesar cada ronda expirada
    for (const round of expiredRounds) {
      console.log(`[CRON] Processing round ${round.id} (Fecha ${round.round_number})`)

      // Buscar partidos sin resultado en esta ronda
      const { data: unreportedMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('round_id', round.id)
        .is('winner_id', null)
        .eq('is_not_reported', false)

      if (matchesError) {
        console.error(`[CRON] Error fetching matches for round ${round.id}:`, matchesError)
        continue
      }

      console.log(`[CRON] Found ${unreportedMatches?.length || 0} unreported matches`)

      // Marcar partidos no reportados
      if (unreportedMatches && unreportedMatches.length > 0) {
        for (const match of unreportedMatches) {
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              is_not_reported: true,
              result_loaded_at: new Date().toISOString()
            })
            .eq('id', match.id)

          if (updateError) {
            console.error(`[CRON] Error marking match ${match.id} as unreported:`, updateError)
          } else {
            console.log(`[CRON] Marked match ${match.id} as unreported`)
          }
        }
      }

      // Cerrar la ronda
      const { error: closeError } = await supabase
        .from('rounds')
        .update({
          status: 'expired',
          closed_by_admin_at: new Date().toISOString()
        })
        .eq('id', round.id)

      if (closeError) {
        console.error(`[CRON] Error closing round ${round.id}:`, closeError)
        results.push({
          roundId: round.id,
          roundNumber: round.round_number,
          success: false,
          error: closeError.message
        })
      } else {
        console.log(`[CRON] Successfully closed round ${round.id}`)

        // Recalcular tabla de posiciones
        await recalculateStandings(supabase, round.category_id)

        // Activar la siguiente fecha (si existe y está pending)
        const { data: nextRound } = await supabase
          .from('rounds')
          .select('id, round_number')
          .eq('category_id', round.category_id)
          .eq('round_number', round.round_number + 1)
          .eq('status', 'pending')
          .single()

        if (nextRound) {
          await supabase
            .from('rounds')
            .update({ status: 'active' })
            .eq('id', nextRound.id)

          console.log(`[CRON] Activated next round ${nextRound.id} (round ${nextRound.round_number})`)
        }

        results.push({
          roundId: round.id,
          roundNumber: round.round_number,
          success: true,
          unreportedMatches: unreportedMatches?.length || 0
        })
      }
    }

    console.log(`[CRON] Finished processing ${expiredRounds.length} rounds`)

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredRounds.length} expired rounds`,
      closedRounds: results.filter(r => r.success).length,
      results
    })

  } catch (error: any) {
    console.error('[CRON] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Recalcula la tabla de posiciones de una categoría
 * Copia de la lógica en /app/actions/matches.ts
 */
async function recalculateStandings(supabase: any, categoryId: string) {
  console.log(`[CRON] Recalculating standings for category ${categoryId}`)

  // Obtener todos los partidos completados de la categoría
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('category_id', categoryId)
    .not('winner_id', 'is', null)

  if (!matches || matches.length === 0) {
    console.log('[CRON] No completed matches found')
    return
  }

  // Obtener todos los jugadores de la categoría
  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('current_category_id', categoryId)

  if (!players) {
    return
  }

  // Inicializar estadísticas para cada jugador
  const stats: Record<string, any> = {}
  players.forEach((player: any) => {
    stats[player.id] = {
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      matches_won_by_wo: 0,
      matches_lost_by_wo: 0,
      points: 0,
      sets_won: 0,
      sets_lost: 0,
      games_won: 0,
      games_lost: 0
    }
  })

  // Procesar cada partido
  matches.forEach((match: any) => {
    const player1Id = match.player1_id
    const player2Id = match.player2_id
    const winnerId = match.winner_id
    const loserId = winnerId === player1Id ? player2Id : player1Id

    if (!stats[player1Id] || !stats[player2Id]) {
      return
    }

    // Incrementar partidos jugados
    stats[player1Id].matches_played++
    stats[player2Id].matches_played++

    // Determinar ganador/perdedor
    stats[winnerId].matches_won++
    stats[loserId].matches_lost++

    // Si es WO o no reportado, no se suman sets/games
    if (match.is_walkover) {
      stats[winnerId].matches_won_by_wo++
      stats[loserId].matches_lost_by_wo++
      stats[winnerId].points += 1
      return
    }

    if (match.is_not_reported) {
      // Penalización: ambos jugadores pierden (0 puntos)
      // Ya se incrementó matches_played para ambos
      return
    }

    // Calcular sets ganados/perdidos
    let player1Sets = 0
    let player2Sets = 0

    // Set 1
    if (match.set1_player1_games > match.set1_player2_games) {
      player1Sets++
      stats[player1Id].sets_won++
      stats[player2Id].sets_lost++
    } else {
      player2Sets++
      stats[player2Id].sets_won++
      stats[player1Id].sets_lost++
    }

    // Set 2
    if (match.set2_player1_games > match.set2_player2_games) {
      player1Sets++
      stats[player1Id].sets_won++
      stats[player2Id].sets_lost++
    } else {
      player2Sets++
      stats[player2Id].sets_won++
      stats[player1Id].sets_lost++
    }

    // Set 3 (si existe)
    if (match.set3_player1_games !== null && match.set3_player2_games !== null) {
      if (match.set3_player1_games > match.set3_player2_games) {
        player1Sets++
        stats[player1Id].sets_won++
        stats[player2Id].sets_lost++
      } else {
        player2Sets++
        stats[player2Id].sets_won++
        stats[player1Id].sets_lost++
      }
    }

    // Calcular games ganados/perdidos
    const player1Games = (match.set1_player1_games || 0) + (match.set2_player1_games || 0) + (match.set3_player1_games || 0)
    const player2Games = (match.set1_player2_games || 0) + (match.set2_player2_games || 0) + (match.set3_player2_games || 0)

    stats[player1Id].games_won += player1Games
    stats[player1Id].games_lost += player2Games
    stats[player2Id].games_won += player2Games
    stats[player2Id].games_lost += player1Games

    // Puntos: 1 por partido ganado
    stats[winnerId].points += 1
  })

  // Actualizar la tabla de posiciones en la base de datos
  for (const playerId of Object.keys(stats)) {
    await supabase
      .from('standings')
      .update(stats[playerId])
      .eq('category_id', categoryId)
      .eq('player_id', playerId)
  }

  // Calcular posiciones basadas en puntos
  await calculatePositions(supabase, categoryId)

  console.log('[CRON] Standings recalculated successfully')
}

/**
 * Calcula las posiciones en la tabla
 */
async function calculatePositions(supabase: any, categoryId: string) {
  const { data: standings } = await supabase
    .from('standings')
    .select('*')
    .eq('category_id', categoryId)

  if (!standings) {
    return
  }

  // Ordenar según criterios de desempate
  const sortedStandings = standings.sort((a: any, b: any) => {
    // 1. Mayor puntos
    if (b.points !== a.points) {
      return b.points - a.points
    }

    // 2. Mejor diferencia de sets
    const aSetsDiv = a.sets_won - a.sets_lost
    const bSetsDiv = b.sets_won - b.sets_lost
    if (bSetsDiv !== aSetsDiv) {
      return bSetsDiv - aSetsDiv
    }

    // 3. Mejor diferencia de games
    const aGamesDiv = a.games_won - a.games_lost
    const bGamesDiv = b.games_won - b.games_lost
    if (bGamesDiv !== aGamesDiv) {
      return bGamesDiv - aGamesDiv
    }

    return 0
  })

  // Asignar posiciones
  for (let i = 0; i < sortedStandings.length; i++) {
    await supabase
      .from('standings')
      .update({ position: i + 1 })
      .eq('id', sortedStandings[i].id)
  }
}
