import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()

  // Intentar obtener categorías
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">🧪 Test de Conexión Supabase</h1>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error.message}
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Conexión exitosa! Se encontraron {categories?.length || 0} categorías
        </div>
      )}

      <h2 className="text-2xl font-bold mt-6 mb-4">Categorías:</h2>
      <div className="grid grid-cols-1 gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="border p-4 rounded shadow">
            <h3 className="font-bold text-lg">{cat.name}</h3>
            <p className="text-gray-600">Temporada: {cat.season_year}</p>
            <p className="text-sm text-gray-500">ID: {cat.id}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a href="/" className="text-blue-600 hover:underline">← Volver al inicio</a>
      </div>
    </div>
  )
}
