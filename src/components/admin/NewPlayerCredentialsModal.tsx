'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewPlayerCredentialsModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const newPlayer = searchParams.get('newPlayer')
  const email = searchParams.get('email')
  const password = searchParams.get('password')
  const name = searchParams.get('name')
  const phone = searchParams.get('phone')

  useEffect(() => {
    if (newPlayer === 'true' && email && password) {
      setShow(true)
    }
  }, [newPlayer, email, password])

  const handleClose = () => {
    setShow(false)
    // Limpiar query params
    router.replace(window.location.pathname)
  }

  const handleCopy = () => {
    const credentials = `Email: ${email}\nContraseña: ${password}`
    navigator.clipboard.writeText(credentials)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!phone) return

    const loginUrl = `${window.location.origin}/jugador/login`
    const message = `¡Hola! Tu cuenta de la Liga de Tenis ya está lista 🎾

*Credenciales de acceso:*
📧 Email: ${email}
🔑 Contraseña: ${password}

*Link de acceso:*
${loginUrl}

*Importante:*
Por favor, cambia tu contraseña en tu primer login.

¡Nos vemos en la cancha!`

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 text-center">
            ¡Jugador creado con éxito!
          </h2>
          {name && (
            <p className="text-center text-gray-600 mt-1">{name}</p>
          )}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Credenciales de acceso
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Guarda estas credenciales y envíaselas al jugador.
                <strong className="block mt-1">No podrás verlas de nuevo.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📧 Email
            </label>
            <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-sm">
              {email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔑 Contraseña temporal
            </label>
            <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-sm break-all">
              {password}
            </div>
          </div>
        </div>

        <div className="bg-celeste-50 border border-celeste-200 rounded p-3 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Próximos pasos:</strong>
          </p>
          <ol className="text-sm text-gray-600 mt-2 list-decimal list-inside space-y-1">
            <li>Copia estas credenciales</li>
            <li>Envíaselas al jugador (WhatsApp, email, etc.)</li>
            <li>El jugador debe cambiar su contraseña en su primer login</li>
          </ol>
        </div>

        <div className="space-y-3">
          {/* Botón de WhatsApp (solo si hay teléfono) */}
          {phone && (
            <button
              onClick={handleWhatsApp}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span>
              Enviar por WhatsApp
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-950 transition font-medium"
            >
              {copied ? '✅ Copiado' : '📋 Copiar Credenciales'}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
