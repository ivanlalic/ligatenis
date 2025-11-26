'use client'

import { signInPlayer } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gradient-to-br from-celeste-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <div className="inline-block bg-primary-900 text-white rounded-full p-4 mb-4">
            <span className="text-4xl">🎾</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-primary-900 mb-2">
            Liga de Tenis
          </h1>
          <p className="text-gray-600">
            Club Atletico del Rosario
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-900 p-8">
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">
            Ingreso de Jugadores
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form action={signInPlayer} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="tu-email@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition font-medium shadow-sm"
            >
              Ingresar
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              ¿No tienes credenciales?<br />
              Contacta al administrador de la liga
            </p>
          </div>
        </div>

        {/* Link público */}
        <div className="mt-6 text-center">
          <Link
            href="/categorias"
            className="text-sm text-primary-900 hover:text-primary-950 font-medium"
          >
            ← Ver tabla de posiciones pública
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
