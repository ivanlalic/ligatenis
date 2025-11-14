export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🎾 Liga de Tenis 2026</h1>
        <p className="text-xl text-gray-600">Sistema en construcción...</p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/admin"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Dashboard Admin
          </a>
          <a
            href="/categorias"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Ver Categorías (Público)
          </a>
        </div>
      </div>
    </main>
  )
}
