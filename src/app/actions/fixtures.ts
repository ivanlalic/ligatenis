'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculatePositions } from './matches'

/**
 * Algoritmo Round Robin para generar fixture de todos contra todos
 * @param players Array de IDs de jugadores
 * @returns Array de jornadas, cada una con array de partidos [player1_id, player2_id]
 */
function generateRoundRobin(players: string[]): string[][][] {
  const n = players.length

  // Si hay número impar de jugadores, agregamos un "bye" (null)
  const hasOddPlayers = n % 2 === 1
  const participants = hasOddPlayers ? [...players, 'BYE'] : [...players]
  const totalParticipants = participants.length
  const numRounds = totalParticipants - 1
  const matchesPerRound = totalParticipants / 2

  const rounds: string[][][] = []

  // Algoritmo de rotación circular
  // Fijamos el primer jugador y rotamos el resto
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: string[][] = []

    for (let match = 0; match < matchesPerRound; match++) {
      let home: number
      let away: number

      if (match === 0) {
        home = 0
        away = round + 1
      } else {
        home = ((round + 1 - match + totalParticipants - 2) % (totalParticipants - 1)) + 1
        away = ((round + match) % (totalParticipants - 1)) + 1
      }

      // Solo agregamos el partido si ninguno de los dos es "BYE"
      if (participants[home] !== 'BYE' && participants[away] !== 'BYE') {
        roundMatches.push([participants[home], participants[away]])
      }
    }

    rounds.push(roundMatches)
  }

  return rounds
}

/**
 * Genera el fixture completo para una categoría
 * @param categoryId ID de la categoría
 * @param startDate Fecha de inicio del torneo (primera jornada)
 * @param roundDurationDays Duración en días de cada jornada
 */
export async function generateFixture(
  categoryId: string,
  startDate: string,
  roundDurationDays: number = 15
) {
  const supabase = await createClient()

  // 1. Verificar si ya existe un fixture para esta categoría
  const { data: existingRounds } = await supabase
    .from('rounds')
    .select('id')
    .eq('category_id', categoryId)
    .limit(1)

  if (existingRounds && existingRounds.length > 0) {
    throw new Error('Esta categoría ya tiene un fixture generado. Elimínalo primero si quieres generar uno nuevo.')
  }

  // 2. Obtener jugadores activos de la categoría
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('current_category_id', categoryId)
    .eq('status', 'active')

  if (playersError) {
    console.error('Error fetching players:', playersError.message)
    throw new Error('Error al obtener jugadores')
  }

  if (!players || players.length < 2) {
    throw new Error('Se necesitan al menos 2 jugadores activos para generar un fixture')
  }

  // 3. Generar fixture con algoritmo Round Robin
  const playerIds = players.map(p => p.id)
  const rounds = generateRoundRobin(playerIds)

  // 4. Crear las jornadas y partidos en la base de datos
  // Construir fecha en zona horaria local para evitar problemas con UTC
  const [year, month, day] = startDate.split('-').map(Number)
  const start = new Date(year, month - 1, day)

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    // Calcular fecha de inicio de esta jornada
    const roundDate = new Date(start)
    roundDate.setDate(start.getDate() + (roundIndex * roundDurationDays))

    // Calcular fecha de fin (duración - 1 días después del inicio)
    const periodEnd = new Date(roundDate)
    periodEnd.setDate(roundDate.getDate() + (roundDurationDays - 1))

    // Ajustar si termina el 30 pero el mes tiene 31 días
    if (periodEnd.getDate() === 30) {
      const month = periodEnd.getMonth()
      const year = periodEnd.getFullYear()
      // Obtener el último día del mes (día 0 del mes siguiente)
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
      if (lastDayOfMonth === 31) {
        periodEnd.setDate(31)
      }
    }

    // Crear la jornada
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert([{
        category_id: categoryId,
        round_number: roundIndex + 1,
        period_start: roundDate.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'pending'
      }])
      .select()
      .single()

    if (roundError) {
      console.error('Error creating round:', roundError.message)
      throw new Error(`Error al crear jornada ${roundIndex + 1}`)
    }

    // Crear los partidos de esta jornada
    const matches = rounds[roundIndex].map(([player1_id, player2_id]) => ({
      round_id: round.id,
      category_id: categoryId,
      player1_id,
      player2_id
    }))

    const { error: matchesError } = await supabase
      .from('matches')
      .insert(matches)

    if (matchesError) {
      console.error('Error creating matches:', matchesError.message)
      throw new Error(`Error al crear partidos de jornada ${roundIndex + 1}`)
    }
  }

  // 5. Crear registros iniciales en la tabla de posiciones
  const standingsRecords = players.map(player => ({
    category_id: categoryId,
    player_id: player.id,
    position: 0,
    points: 0,
    matches_played: 0,
    matches_won: 0,
    matches_lost: 0,
    matches_won_by_wo: 0,
    matches_lost_by_wo: 0,
    sets_won: 0,
    sets_lost: 0,
    games_won: 0,
    games_lost: 0
  }))

  const { error: standingsError } = await supabase
    .from('standings')
    .insert(standingsRecords)

  if (standingsError) {
    console.error('Error creating standings:', standingsError.message)
    throw new Error('Error al crear tabla de posiciones')
  }

  // 6. Calcular posiciones iniciales (ordenadas alfabéticamente)
  await calculatePositions(categoryId)

  revalidatePath('/admin/categorias')
  revalidatePath(`/admin/categorias/${categoryId}`)
  redirect(`/admin/categorias/${categoryId}`)
}

/**
 * Elimina el fixture completo de una categoría
 */
export async function deleteFixture(categoryId: string) {
  const supabase = await createClient()

  // Verificar si hay algún partido con resultados
  const { data: completedMatches } = await supabase
    .from('matches')
    .select('id, rounds!inner(category_id)')
    .eq('rounds.category_id', categoryId)
    .eq('status', 'completed')
    .limit(1)

  if (completedMatches && completedMatches.length > 0) {
    throw new Error('No se puede eliminar el fixture porque ya hay partidos con resultados cargados')
  }

  // Eliminar en orden: matches, standings, rounds
  // (Los matches se eliminan automáticamente por CASCADE)
  const { error: standingsError } = await supabase
    .from('standings')
    .delete()
    .eq('category_id', categoryId)

  if (standingsError) {
    console.error('Error deleting standings:', standingsError.message)
    throw new Error('Error al eliminar tabla de posiciones')
  }

  const { error: roundsError } = await supabase
    .from('rounds')
    .delete()
    .eq('category_id', categoryId)

  if (roundsError) {
    console.error('Error deleting rounds:', roundsError.message)
    throw new Error('Error al eliminar jornadas')
  }

  revalidatePath('/admin/categorias')
  revalidatePath(`/admin/categorias/${categoryId}`)
}
