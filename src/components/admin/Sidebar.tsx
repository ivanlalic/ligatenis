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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-900 text-white rounded-lg shadow-lg hover:bg-primary-950 transition"
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
          w-64 bg-gradient-to-b from-primary-900 to-primary-950 text-white min-h-screen flex flex-col shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-primary-800/50">
          <h1 className="text-2xl font-heading font-bold">🎾 Plaza Jewell</h1>
          <p className="text-sm text-celeste-300 mt-1">Panel Admin</p>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-celeste-400 text-primary-950 shadow-md'
                        : 'text-white/80 hover:bg-primary-800/50 hover:text-white'
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
          <div className="mt-6 pt-6 border-t border-primary-800/50">
            <Link
              href="/categorias"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-celeste-400 hover:text-primary-950 transition-all duration-200"
            >
              <span className="text-xl">🌐</span>
              <span className="font-medium">Ver Sitio Público</span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-800/50">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-white transition-all duration-200"
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
