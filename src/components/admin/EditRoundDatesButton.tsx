'use client'

import { useState } from 'react'
import { updateRoundDates } from '@/app/actions/rounds'

interface EditRoundDatesButtonProps {
  roundId: string
  roundNumber: number
  currentPeriodStart: string
  currentPeriodEnd: string
}

export default function EditRoundDatesButton({
  roundId,
  roundNumber,
  currentPeriodStart,
  currentPeriodEnd
}: EditRoundDatesButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const periodStart = formData.get('period_start') as string
      const periodEnd = formData.get('period_end') as string

      await updateRoundDates(roundId, periodStart, periodEnd)
      setShowModal(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al actualizar fechas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        📝 Editar fechas
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Editar Fechas - Jornada {roundNumber}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="period_start" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  id="period_start"
                  name="period_start"
                  required
                  defaultValue={currentPeriodStart}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="period_end" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  id="period_end"
                  name="period_end"
                  required
                  defaultValue={currentPeriodEnd}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  La fecha de fin debe ser posterior o igual a la fecha de inicio
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
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
