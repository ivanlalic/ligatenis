'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Carga el resultado de un partido
 */
export async function loadMatchResult(
  matchId: string,
  data: {
    winnerId: string
    set1Player1: number
    set1Player2: number
    set2Player1: number
    set2Player2: number
    set3Player1?: number
    set3Player2?: number
    isWalkover: boolean
    walkoverReason?: string
  }
) {
  const supabase = await createClient()

  // Obtener el partido con información completa
  const { data: match } = await supabase
    .from('matches')
    .select('*, rounds(category_id)')
    .eq('id', matchId)
    .single()

  if (!match) {
    throw new Error('Partido no encontrado')
  }

  // Actualizar el partido con el resultado
  const { error: matchError } = await supabase
    .from('matches')
    .update({
      winner_id: data.winnerId,
      set1_player1_games: data.set1Player1,
      set1_player2_games: data.set1Player2,
      set2_player1_games: data.set2Player1,
      set2_player2_games: data.set2Player2,
      set3_player1_games: data.set3Player1 || null,
      set3_player2_games: data.set3Player2 || null,
      is_walkover: data.isWalkover,
      walkover_reason: data.walkoverReason || null,
      is_not_reported: false,
      result_loaded_at: new Date().toISOString()
    })
    .eq('id', matchId)

  if (matchError) {
    console.error('Error updating match:', matchError.message)
    throw new Error('Error al cargar el resultado')
  }

  // Nota: La tabla de posiciones se actualiza solo cuando se cierra la fecha
  revalidatePath('/admin/categorias')
}

/**
 * Marca un partido como no reportado
 */
export async function markMatchAsNotReported(matchId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('matches')
    .update({
      is_not_reported: true,
      winner_id: null,
      result_loaded_at: new Date().toISOString()
    })
    .eq('id', matchId)

  if (error) {
    console.error('Error marking match as not reported:', error.message)
    throw new Error('Error al marcar partido como no reportado')
  }

  revalidatePath('/admin/categorias')
}

/**
 * Recalcula la tabla de posiciones de una categoría
 */
async function recalculateStandings(categoryId: string) {
  const supabase = await createClient()

  // Obtener todos los partidos completados de la categoría
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('category_id', categoryId)
    .not('winner_id', 'is', null)

  if (!matches || matches.length === 0) {
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
  players.forEach(player => {
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
  matches.forEach(match => {
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

    // Si es WO
    if (match.is_walkover) {
      stats[winnerId].matches_won_by_wo++
      stats[loserId].matches_lost_by_wo++
      // WO cuenta como partido ganado pero no se suman sets/games
      stats[winnerId].points += 1
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

  // Calcular posiciones basadas en puntos (y criterios de desempate)
  await calculatePositions(categoryId)
}

/**
 * Calcula las posiciones en la tabla basándose en puntos y criterios de desempate
 * Criterios en orden:
 * 1. Mayor puntos
 * 2. Mejor diferencia de sets (sets ganados - sets perdidos)
 * 3. Mejor diferencia de games (games ganados - games perdidos)
 * 4. Orden alfabético (apellido, nombre)
 */
export async function calculatePositions(categoryId: string) {
  const supabase = await createClient()

  // Obtener la tabla con nombres de jugadores para ordenamiento alfabético
  const { data: standings } = await supabase
    .from('standings')
    .select(`
      *,
      player:players(first_name, last_name)
    `)
    .eq('category_id', categoryId)

  if (!standings) {
    return
  }

  // Ordenar manualmente con todos los criterios de desempate
  const sortedStandings = standings.sort((a, b) => {
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

    // 4. Orden alfabético (apellido, nombre)
    const aName = `${a.player.last_name} ${a.player.first_name}`.toLowerCase()
    const bName = `${b.player.last_name} ${b.player.first_name}`.toLowerCase()
    return aName.localeCompare(bName)
  })

  // Asignar posiciones
  for (let i = 0; i < sortedStandings.length; i++) {
    await supabase
      .from('standings')
      .update({ position: i + 1 })
      .eq('id', sortedStandings[i].id)
  }
}

/**
 * Permite a un jugador cargar el resultado de su propio partido
 * Valida que el jugador sea participante y que la ronda esté activa
 */
export async function submitPlayerMatchResult(formData: FormData) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Debes estar autenticado para cargar resultados')
  }

  // Obtener el jugador del usuario autenticado
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!player) {
    throw new Error('No se encontró tu perfil de jugador')
  }

  // Obtener datos del formulario
  const matchId = formData.get('match_id') as string
  const winnerId = formData.get('winner_id') as string
  const isWalkover = formData.get('is_walkover') === 'true'
  const walkoverReason = formData.get('walkover_reason') as string | null

  // Obtener el partido con información de la ronda
  const { data: match } = await supabase
    .from('matches')
    .select('*, round:rounds!inner(*)')
    .eq('id', matchId)
    .single()

  if (!match) {
    throw new Error('Partido no encontrado')
  }

  // Validar que el jugador sea uno de los participantes
  if (match.player1_id !== player.id && match.player2_id !== player.id) {
    throw new Error('No puedes cargar resultados de un partido en el que no participas')
  }

  // Validar que la ronda esté activa
  if (match.round.status !== 'active') {
    throw new Error('Solo se pueden cargar resultados de rondas activas')
  }

  // Validar que el partido no tenga resultado ya cargado
  if (match.winner_id !== null) {
    throw new Error('Este partido ya tiene un resultado cargado')
  }

  // Preparar datos de actualización
  const updateData: any = {
    winner_id: winnerId,
    is_walkover: isWalkover,
    walkover_reason: isWalkover ? walkoverReason : null,
    is_not_reported: false,
    result_loaded_at: new Date().toISOString()
  }

  // Si no es WO, obtener los games de cada set
  if (!isWalkover) {
    updateData.set1_player1_games = parseInt(formData.get('set1_player1') as string)
    updateData.set1_player2_games = parseInt(formData.get('set1_player2') as string)
    updateData.set2_player1_games = parseInt(formData.get('set2_player1') as string)
    updateData.set2_player2_games = parseInt(formData.get('set2_player2') as string)

    // Set 3 es opcional
    const set3Player1 = formData.get('set3_player1') as string
    const set3Player2 = formData.get('set3_player2') as string

    if (set3Player1 && set3Player2) {
      updateData.set3_player1_games = parseInt(set3Player1)
      updateData.set3_player2_games = parseInt(set3Player2)
    }
  }

  // Actualizar el partido
  const { error: matchError } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)

  if (matchError) {
    console.error('Error updating match:', matchError.message)
    throw new Error('Error al cargar el resultado')
  }

  // Nota: La tabla de posiciones se actualiza solo cuando se cierra la fecha
  revalidatePath('/jugador/dashboard')
  revalidatePath('/categorias')
}

/**
 * Cierra una jornada (marca como completada)
 */
export async function closeRound(roundId: string) {
  const supabase = await createClient()

  // Obtener la ronda para saber la categoría
  const { data: round } = await supabase
    .from('rounds')
    .select('category_id')
    .eq('id', roundId)
    .single()

  if (!round) {
    throw new Error('Ronda no encontrada')
  }

  // Verificar que todos los partidos tengan resultado o estén marcados como no reportados
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('round_id', roundId)
    .is('winner_id', null)
    .eq('is_not_reported', false)

  if (pendingMatches && pendingMatches.length > 0) {
    throw new Error(`Hay ${pendingMatches.length} partido(s) sin resultado. Todos los partidos deben tener un resultado cargado o estar marcados como "no reportado" antes de cerrar la fecha.`)
  }

  const { error } = await supabase
    .from('rounds')
    .update({
      status: 'completed',
      closed_by_admin_at: new Date().toISOString()
    })
    .eq('id', roundId)

  if (error) {
    console.error('Error closing round:', error.message)
    throw new Error('Error al cerrar la jornada')
  }

  // Recalcular tabla de posiciones al cerrar la fecha
  await recalculateStandings(round.category_id)

  revalidatePath('/admin/categorias')
  revalidatePath(`/admin/categorias/${round.category_id}`)
  revalidatePath('/categorias')
}
