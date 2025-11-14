'use client'

import { useState } from 'react'

export default function ReorderCategoryButtons({
  categoryId,
  isFirst,
  isLast,
  moveUpAction,
  moveDownAction,
}: {
  categoryId: string
  isFirst: boolean
  isLast: boolean
  moveUpAction: (id: string) => Promise<{ error?: string } | void>
  moveDownAction: (id: string) => Promise<{ error?: string } | void>
}) {
  const [isMoving, setIsMoving] = useState(false)

  const handleMoveUp = async () => {
    setIsMoving(true)
    await moveUpAction(categoryId)
    setIsMoving(false)
  }

  const handleMoveDown = async () => {
    setIsMoving(true)
    await moveDownAction(categoryId)
    setIsMoving(false)
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={handleMoveUp}
        disabled={isFirst || isMoving}
        className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Subir"
      >
        ↑
      </button>
      <button
        onClick={handleMoveDown}
        disabled={isLast || isMoving}
        className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Bajar"
      >
        ↓
      </button>
    </div>
  )
}
