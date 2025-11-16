'use client'

import { useState, useMemo } from 'react'
import { addPlayerToCategory } from '@/app/actions/players'
import Link from 'next/link'

interface Player {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  current_category_id: string | null
  status: string
}

interface AddPlayersToCategoryProps {
  categoryId: string
  categoryName: string
  allPlayers: Player[]
  currentPlayerIds: string[]
}

export default function AddPlayersToCategory({
  categoryId,
  categoryName,
  allPlayers,
  currentPlayerIds,
}: AddPlayersToCategoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [addingPlayerId, setAddingPlayerId] = useState<string | null>(null)

  // Filtrar jugadores que NO están en esta categoría y están activos
  const availablePlayers = useMemo(() => {
    return allPlayers.filter(
      (player) => !currentPlayerIds.includes(player.id) && player.status === 'active'
    )
  }, [allPlayers, currentPlayerIds])

  // Filtrar por búsqueda
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return availablePlayers

    const term = searchTerm.toLowerCase()
    return availablePlayers.filter(
      (player) =>
        player.first_name.toLowerCase().includes(term) ||
        player.last_name.toLowerCase().includes(term) ||
        `${player.last_name} ${player.first_name}`.toLowerCase().includes(term) ||
        `${player.first_name} ${player.last_name}`.toLowerCase().includes(term)
    )
  }, [availablePlayers, searchTerm])

  const handleAddPlayer = async (playerId: string) => {
    setAddingPlayerId(playerId)
    try {
      await addPlayerToCategory(playerId, categoryId)
      setSearchTerm('')
      // Cerrar modal si no quedan más jugadores filtrados
      if (filteredPlayers.length === 1) {
        setIsOpen(false)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al agregar jugador')
    } finally {
      setAddingPlayerId(null)
    }
  }

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-heading font-bold text-primary-900">
              Agregar Jugadores
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Asigna jugadores existentes a esta categoría
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-celeste-400 text-primary-950 rounded-lg hover:bg-celeste-500 transition shadow-md"
          >
            + Agregar Jugadores
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-bold text-primary-900">
            Agregar Jugadores a {categoryName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Busca y agrega jugadores existentes o crea uno nuevo
          </p>
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setSearchTerm('')
          }}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o apellido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Lista de jugadores disponibles */}
      {filteredPlayers.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-celeste-400 transition"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {player.last_name}, {player.first_name}
                </div>
                <div className="text-sm text-gray-600">{player.email}</div>
                {player.current_category_id && (
                  <div className="text-xs text-yellow-600 mt-1">
                    ⚠️ Ya está asignado a otra categoría
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAddPlayer(player.id)}
                disabled={addingPlayerId === player.id}
                className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingPlayerId === player.id ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          ))}
        </div>
      ) : searchTerm.trim() ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">
            No se encontró ningún jugador con "{searchTerm}"
          </p>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No hay jugadores disponibles para agregar</p>
        </div>
      )}

      {/* Botón crear nuevo jugador */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          href={`/admin/jugadores/nuevo?categoria=${categoryId}`}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-celeste-400 text-primary-950 rounded-lg hover:bg-celeste-500 transition shadow-md font-medium"
        >
          <span className="text-lg">➕</span>
          Crear Nuevo Jugador
        </Link>
      </div>
    </div>
  )
}
