'use client'

import { useState } from 'react'
import { loadMatchResult, markMatchAsNotReported } from '@/app/actions/matches'

interface LoadMatchResultButtonProps {
  matchId: string
  player1: { id: string; first_name: string; last_name: string }
  player2: { id: string; first_name: string; last_name: string }
  hasResult: boolean
}

export default function LoadMatchResultButton({
  matchId,
  player1,
  player2,
  hasResult
}: LoadMatchResultButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isWalkover, setIsWalkover] = useState(false)
  const [winnerId, setWinnerId] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      if (isWalkover) {
        // Si es WO, necesitamos el ganador seleccionado manualmente
        if (!winnerId) {
          alert('Debes seleccionar un ganador para el WO')
          setIsLoading(false)
          return
        }

        await loadMatchResult(matchId, {
          winnerId,
          set1Player1: 0,
          set1Player2: 0,
          set2Player1: 0,
          set2Player2: 0,
          isWalkover: true,
          walkoverReason: formData.get('walkover_reason') as string
        })
      } else {
        // Resultado normal - calcular ganador automáticamente
        const set1Player1 = parseInt(formData.get('set1_player1') as string)
        const set1Player2 = parseInt(formData.get('set1_player2') as string)
        const set2Player1 = parseInt(formData.get('set2_player1') as string)
        const set2Player2 = parseInt(formData.get('set2_player2') as string)
        const set3Player1 = formData.get('set3_player1') ? parseInt(formData.get('set3_player1') as string) : undefined
        const set3Player2 = formData.get('set3_player2') ? parseInt(formData.get('set3_player2') as string) : undefined

        // Calcular sets ganados por cada jugador
        let player1Sets = 0
        let player2Sets = 0

        if (set1Player1 > set1Player2) player1Sets++
        else player2Sets++

        if (set2Player1 > set2Player2) player1Sets++
        else player2Sets++

        if (set3Player1 !== undefined && set3Player2 !== undefined) {
          if (set3Player1 > set3Player2) player1Sets++
          else player2Sets++
        }

        // Determinar ganador
        const calculatedWinnerId = player1Sets > player2Sets ? player1.id : player2.id

        await loadMatchResult(matchId, {
          winnerId: calculatedWinnerId,
          set1Player1,
          set1Player2,
          set2Player1,
          set2Player2,
          set3Player1,
          set3Player2,
          isWalkover: false
        })
      }

      setShowModal(false)
      setWinnerId('')
      setIsWalkover(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al cargar resultado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsNotReported = async () => {
    if (!confirm('¿Marcar este partido como NO REPORTADO?\n\nEsto significa que los jugadores no informaron el resultado.')) {
      return
    }

    setIsLoading(true)
    try {
      await markMatchAsNotReported(matchId)
      setShowModal(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al marcar como no reportado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`text-sm font-medium ${
          hasResult
            ? 'text-green-600 hover:text-green-700'
            : 'text-primary-600 hover:text-primary-700'
        }`}
      >
        {hasResult ? '✅ Ver/Editar' : '📝 Cargar resultado'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Cargar Resultado del Partido
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Jugador 1</p>
                  <p className="text-lg font-bold text-gray-900">
                    {player1.last_name}, {player1.first_name}
                  </p>
                </div>
                <div className="text-2xl text-gray-400 mx-4">vs</div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Jugador 2</p>
                  <p className="text-lg font-bold text-gray-900">
                    {player2.last_name}, {player2.first_name}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de resultado */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isWalkover}
                    onChange={(e) => setIsWalkover(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Este partido fue por WO (walkover)
                  </span>
                </label>
              </div>

              {/* Ganador - solo para WO */}
              {isWalkover && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ganador *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWinnerId(player1.id)}
                      className={`px-4 py-3 rounded-lg border-2 transition ${
                        winnerId === player1.id
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {player1.last_name}, {player1.first_name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWinnerId(player2.id)}
                      className={`px-4 py-3 rounded-lg border-2 transition ${
                        winnerId === player2.id
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {player2.last_name}, {player2.first_name}
                    </button>
                  </div>
                </div>
              )}

              {isWalkover ? (
                /* Razón del WO */
                <div>
                  <label htmlFor="walkover_reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Razón del WO
                  </label>
                  <textarea
                    id="walkover_reason"
                    name="walkover_reason"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Lesión, no presentación, etc."
                  />
                </div>
              ) : (
                /* Sets y games - formato tabla */
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">Resultado por Sets</p>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Jugador
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                            Set 1
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                            Set 2
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                            Set 3
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* Player 1 */}
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {player1.last_name}, {player1.first_name}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name="set1_player1"
                              required
                              min="0"
                              max="7"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name="set2_player1"
                              required
                              min="0"
                              max="7"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name="set3_player1"
                              min="0"
                              max="7"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                        {/* Player 2 */}
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {player2.last_name}, {player2.first_name}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name="set1_player2"
                              required
                              min="0"
                              max="7"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name="set2_player2"
                              required
                              min="0"
                              max="7"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              name="set3_player2"
                              min="0"
                              max="7"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-gray-500">
                    * Set 3 es opcional. Solo completarlo si el partido llegó al tercer set.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isLoading || !winnerId}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Resultado'}
                </button>
                <button
                  type="button"
                  onClick={handleMarkAsNotReported}
                  disabled={isLoading}
                  className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-medium disabled:opacity-50"
                >
                  No Reportado
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
