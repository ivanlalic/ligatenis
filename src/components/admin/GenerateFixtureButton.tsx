'use client'

import { useState } from 'react'
import { generateFixture, deleteFixture } from '@/app/actions/fixtures'

interface GenerateFixtureButtonProps {
  categoryId: string
  categoryName: string
  hasFixture: boolean
}

export default function GenerateFixtureButton({
  categoryId,
  categoryName,
  hasFixture
}: GenerateFixtureButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!confirm(`¿Generar fixture para ${categoryName}?\n\nEsto creará todas las jornadas y partidos del torneo.`)) {
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const startDate = formData.get('start_date') as string
      const daysBetweenRounds = parseInt(formData.get('days_between_rounds') as string)

      await generateFixture(categoryId, startDate, daysBetweenRounds)
      setShowModal(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al generar fixture')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar todo el fixture de ${categoryName}?\n\n⚠️ ATENCIÓN: Esto eliminará todas las jornadas, partidos y la tabla de posiciones.\n\nSolo es posible si no hay partidos con resultados cargados.`)) {
      return
    }

    setIsLoading(true)
    try {
      await deleteFixture(categoryId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar fixture')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasFixture) {
    return (
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Eliminando...' : '🗑️ Eliminar Fixture'}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        ⚡ Generar Fixture
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Generar Fixture - {categoryName}
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio del Torneo *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Fecha de la primera jornada
                </p>
              </div>

              <div>
                <label htmlFor="days_between_rounds" className="block text-sm font-medium text-gray-700 mb-2">
                  Días entre Jornadas *
                </label>
                <input
                  type="number"
                  id="days_between_rounds"
                  name="days_between_rounds"
                  required
                  defaultValue={7}
                  min={1}
                  max={30}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Intervalo entre cada fecha (recomendado: 7 días)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ El sistema generará automáticamente todas las jornadas usando el algoritmo Round Robin (todos contra todos).
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generando...' : 'Generar'}
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
