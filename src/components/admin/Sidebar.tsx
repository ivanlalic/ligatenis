'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { useState } from 'react'

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Categorías', href: '/admin/categorias', icon: '🏆' },
  { name: 'Jugadores', href: '/admin/jugadores', icon: '👥' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 text-white min-h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">🎾 Liga Tenis</h1>
          <p className="text-sm text-gray-400 mt-1">Panel Admin 2026</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Link a página pública */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <Link
              href="/categorias"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-xl">🌐</span>
              <span className="font-medium">Ver Sitio Público</span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
