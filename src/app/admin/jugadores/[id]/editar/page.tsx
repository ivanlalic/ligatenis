import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { updatePlayer } from '@/app/actions/players'
import Link from 'next/link'

export default async function EditarJugadorPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!player) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  const updateWithId = updatePlayer.bind(null, params.id)

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/jugadores/${params.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Jugador</h1>
        <p className="text-gray-600 mt-1">Modifica la información del jugador</p>
      </div>

      <div className="max-w-2xl bg-white p-8 rounded-lg shadow">
        <form action={updateWithId} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                required
                defaultValue={player.first_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                required
                defaultValue={player.last_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              defaultValue={player.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              El email debe ser único
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={player.phone || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="current_category_id" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría Actual *
            </label>
            <select
              id="current_category_id"
              name="current_category_id"
              required
              defaultValue={player.current_category_id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} (Temporada {cat.season_year})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Puedes cambiar la categoría del jugador (por ejemplo, si ascendió o descendió)
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={player.notes || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Información adicional sobre el jugador
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Guardar Cambios
            </button>
            <Link
              href={`/admin/jugadores/${params.id}`}
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
