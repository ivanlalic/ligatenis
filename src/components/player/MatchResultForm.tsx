'use client'

import { useState } from 'react'
import { submitPlayerMatchResult } from '@/app/actions/matches'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MatchResultFormProps {
  match: any
  currentPlayerId: string
}

export default function MatchResultForm({ match, currentPlayerId }: MatchResultFormProps) {
  const router = useRouter()
  const [isWalkover, setIsWalkover] = useState(false)
  const [winnerId, setWinnerId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPlayer1 = match.player1_id === currentPlayerId

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await submitPlayerMatchResult(formData)
      router.push('/jugador/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al cargar el resultado')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Info del partido */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-900 p-6 mb-6">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">
          Información del Partido
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Jugador 1</p>
            <p className="font-semibold text-primary-900">
              {match.player1.first_name} {match.player1.last_name}
              {isPlayer1 && ' (Tú)'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Jugador 2</p>
            <p className="font-semibold text-primary-900">
              {match.player2.first_name} {match.player2.last_name}
              {!isPlayer1 && ' (Tú)'}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Período:</strong>{' '}
            {new Date(match.round.period_start).toLocaleDateString('es-AR')} -{' '}
            {new Date(match.round.period_end).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-900 p-6">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
          Resultado del Partido
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="match_id" value={match.id} />

          {/* Checkbox WO */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_walkover"
                value="true"
                checked={isWalkover}
                onChange={(e) => setIsWalkover(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900">Walkover (W.O.)</p>
                <p className="text-sm text-gray-600">
                  Marcar si uno de los jugadores no se presentó
                </p>
              </div>
            </label>
          </div>

          {/* Si es WO, mostrar razón */}
          {isWalkover && (
            <div>
              <label htmlFor="walkover_reason" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del W.O.
              </label>
              <input
                type="text"
                id="walkover_reason"
                name="walkover_reason"
                placeholder="Ej: El jugador no se presentó"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* Si NO es WO, mostrar campos de sets */}
          {!isWalkover && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Games por Set</h3>

              {/* Set 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set 1 - {match.player1.first_name}
                  </label>
                  <input
                    type="number"
                    name="set1_player1"
                    min="0"
                    max="7"
                    required={!isWalkover}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set 1 - {match.player2.first_name}
                  </label>
                  <input
                    type="number"
                    name="set1_player2"
                    min="0"
                    max="7"
                    required={!isWalkover}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Set 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set 2 - {match.player1.first_name}
                  </label>
                  <input
                    type="number"
                    name="set2_player1"
                    min="0"
                    max="7"
                    required={!isWalkover}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set 2 - {match.player2.first_name}
                  </label>
                  <input
                    type="number"
                    name="set2_player2"
                    min="0"
                    max="7"
                    required={!isWalkover}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Set 3 (Opcional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set 3 - {match.player1.first_name} (Opcional)
                  </label>
                  <input
                    type="number"
                    name="set3_player1"
                    min="0"
                    max="7"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set 3 - {match.player2.first_name} (Opcional)
                  </label>
                  <input
                    type="number"
                    name="set3_player2"
                    min="0"
                    max="7"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ganador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ganador del partido *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="winner_id"
                  value={match.player1_id}
                  required
                  checked={winnerId === match.player1_id}
                  onChange={(e) => setWinnerId(e.target.value)}
                />
                <span className="font-medium">
                  {match.player1.first_name} {match.player1.last_name}
                  {isPlayer1 && ' (Tú)'}
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="winner_id"
                  value={match.player2_id}
                  required
                  checked={winnerId === match.player2_id}
                  onChange={(e) => setWinnerId(e.target.value)}
                />
                <span className="font-medium">
                  {match.player2.first_name} {match.player2.last_name}
                  {!isPlayer1 && ' (Tú)'}
                </span>
              </label>
            </div>
          </div>

          {/* Nota importante */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Importante
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Asegúrate de que el resultado sea correcto antes de enviarlo.
                  Una vez cargado, no podrás modificarlo.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Resultado'}
            </button>
            <Link
              href="/jugador/dashboard"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
