'use client'

import { useState } from 'react'
import { toggleUserActive } from '../actions'

interface Props {
  userId: string
  isActive: boolean
}

export function ToggleUserButton({ userId, isActive }: Props) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    const result = await toggleUserActive(userId, !active)
    if (!result.error) {
      setActive(!active)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
        active
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
      }`}
    >
      {loading ? '...' : active ? 'Desactivar' : 'Activar'}
    </button>
  )
}
