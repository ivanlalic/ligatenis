import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MatchResultForm from '@/components/player/MatchResultForm'

export default async function MatchResultPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/jugador/login')
  }

  // Obtener el jugador
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!player) {
    redirect('/jugador/login?error=' + encodeURIComponent('No tienes acceso como jugador'))
  }

  // Obtener el partido con todos los detalles
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      *,
      round:rounds!inner(id, round_number, period_start, period_end, status),
      player1:players!matches_player1_id_fkey(id, first_name, last_name),
      player2:players!matches_player2_id_fkey(id, first_name, last_name)
    `)
    .eq('id', params.id)
    .single()

  if (matchError || !match) {
    redirect('/jugador/dashboard')
  }

  // Validar que el jugador sea participante
  if (match.player1_id !== player.id && match.player2_id !== player.id) {
    redirect('/jugador/dashboard')
  }

  // Validar que la ronda esté activa
  if (match.round.status !== 'active') {
    redirect('/jugador/dashboard')
  }

  // Validar que el partido no tenga resultado
  if (match.winner_id !== null) {
    redirect('/jugador/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-celeste-50 via-white to-primary-50">
      {/* Header */}
      <div className="bg-primary-900 text-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold">
            🎾 Cargar Resultado
          </h1>
          <p className="text-celeste-100 text-sm mt-1">
            Fecha {match.round.round_number}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <MatchResultForm match={match} currentPlayerId={player.id} />
      </div>
    </div>
  )
}
