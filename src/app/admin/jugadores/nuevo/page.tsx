import { createClient } from '@/lib/supabase/server'
import { createPlayer } from '@/app/actions/players'
import Link from 'next/link'

export default async function NuevoJugadorPage({
  searchParams,
}: {
  searchParams: { categoria?: string }
}) {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  // Si viene una categoría preseleccionada, obtener sus datos
  const preselectedCategory = searchParams.categoria
    ? categories?.find((c) => c.id === searchParams.categoria)
    : null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-900">Nuevo Jugador</h1>
        <p className="text-gray-600 mt-1">
          {preselectedCategory
            ? `Registra un nuevo jugador para ${preselectedCategory.name}`
            : 'Registra un nuevo jugador en la liga'}
        </p>
      </div>

      <div className="max-w-2xl bg-white p-8 rounded-lg shadow">
        <form action={createPlayer} className="space-y-6">
          {/* Campo oculto para saber a dónde redirigir después de crear */}
          {searchParams.categoria && (
            <input
              type="hidden"
              name="redirect_to"
              value={`/admin/categorias/${searchParams.categoria}`}
            />
          )}

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
              placeholder="5493415594305"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Formato: 54 + 9 + código de área + número (ej: 5493415594305)
            </p>
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={searchParams.categoria || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecciona una categoría</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} (Temporada {cat.season_year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Información adicional sobre el jugador
            </p>
          </div>

          {/* Opción para crear usuario de autenticación */}
          <div className="bg-celeste-50 border-l-4 border-celeste-500 p-4 rounded">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="create_auth_user"
                name="create_auth_user"
                value="true"
                defaultChecked={true}
                className="mt-1 mr-3 h-4 w-4 text-primary-900 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="create_auth_user" className="block text-sm font-medium text-gray-900 cursor-pointer">
                  🔐 Crear usuario de autenticación
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  El jugador podrá ingresar a la plataforma y cargar resultados de sus partidos.
                  Se generará automáticamente un email y contraseña que deberás entregarle.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition font-medium shadow-md"
            >
              Crear Jugador
            </button>
            <Link
              href={
                searchParams.categoria
                  ? `/admin/categorias/${searchParams.categoria}`
                  : '/admin/jugadores'
              }
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
