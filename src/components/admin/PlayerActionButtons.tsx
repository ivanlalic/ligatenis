'use client'

import { useState } from 'react'

export default function PlayerActionButtons({
  playerId,
  playerName,
  isActive,
  deactivateAction,
  reactivateAction,
}: {
  playerId: string
  playerName: string
  isActive: boolean
  deactivateAction: (id: string) => Promise<{ error?: string } | void>
  reactivateAction: (id: string) => Promise<{ error?: string } | void>
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDeactivate = async () => {
    const confirmed = confirm(
      `¿Dar de baja a ${playerName}?\n\nLos partidos futuros se marcarán como WO para los rivales.`
    )

    if (!confirmed) return

    setIsLoading(true)
    await deactivateAction(playerId)
    setIsLoading(false)
  }

  const handleReactivate = async () => {
    setIsLoading(true)
    await reactivateAction(playerId)
    setIsLoading(false)
  }

  if (isActive) {
    return (
      <button
        onClick={handleDeactivate}
        disabled={isLoading}
        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Procesando...' : 'Dar de Baja'}
      </button>
    )
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={isLoading}
      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Procesando...' : 'Reactivar'}
    </button>
  )
}
