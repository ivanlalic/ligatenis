'use client'

import { useState } from 'react'
import { closeRound } from '@/app/actions/matches'

interface CloseRoundButtonProps {
  roundId: string
  roundNumber: number
  status: string
  pendingMatchesCount: number
}

export default function CloseRoundButton({
  roundId,
  roundNumber,
  status,
  pendingMatchesCount
}: CloseRoundButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (status === 'completed') {
    return (
      <span className="text-sm text-green-600 font-medium">
        ✅ Fecha cerrada
      </span>
    )
  }

  const handleClose = async () => {
    if (!confirm(`¿Cerrar la Fecha ${roundNumber}?\n\nEsto marcará la jornada como completada y se recalcularán las posiciones.\n\nNo podrás modificar los resultados después de cerrar.`)) {
      return
    }

    setIsLoading(true)
    try {
      await closeRound(roundId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al cerrar la jornada')
    } finally {
      setIsLoading(false)
    }
  }

  const canClose = pendingMatchesCount === 0

  return (
    <div className="flex items-center gap-3">
      {!canClose && (
        <span className="text-sm text-yellow-600">
          ⚠️ {pendingMatchesCount} partido{pendingMatchesCount > 1 ? 's' : ''} sin resultado
        </span>
      )}
      <button
        onClick={handleClose}
        disabled={isLoading || !canClose}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          canClose
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={!canClose ? 'Todos los partidos deben tener resultado antes de cerrar la fecha' : ''}
      >
        {isLoading ? 'Cerrando...' : '🔒 Cerrar Fecha'}
      </button>
    </div>
  )
}
