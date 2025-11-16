'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Round {
  id: string
  round_number: number
}

export default function RoundSelector({
  rounds,
  selectedRoundNumber,
}: {
  rounds: Round[]
  selectedRoundNumber: number | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (roundNumber: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('fecha', roundNumber)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (!rounds || rounds.length === 0) {
    return null
  }

  return (
    <select
      value={selectedRoundNumber || ''}
      onChange={(e) => handleChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {rounds.map((r) => (
        <option key={r.id} value={r.round_number}>
          Fecha {r.round_number}
        </option>
      ))}
    </select>
  )
}
