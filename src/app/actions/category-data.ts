'use server'

import { createClient } from '@/lib/supabase/server'

// Obtener jugadores de una categoría
export async function getCategoryPlayers(categoryId: string) {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('current_category_id', categoryId)
    .order('last_name', { ascending: true })

  const activePlayers = players?.filter(p => p.status === 'active') || []
  const inactivePlayers = players?.filter(p => p.status === 'inactive') || []

  return { activePlayers, inactivePlayers }
}

// Obtener fixture de una categoría
export async function getCategoryFixture(categoryId: string) {
  const supabase = await createClient()

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
    .eq('category_id', categoryId)
    .order('round_number', { ascending: true })

  return rounds || []
}

// Obtener tabla de posiciones
export async function getCategoryStandings(categoryId: string) {
  const supabase = await createClient()

  const { data: standings } = await supabase
    .from('standings')
    .select(`
      *,
      player:players(id, first_name, last_name)
    `)
    .eq('category_id', categoryId)
    .order('position', { ascending: true })

  return standings || []
}
