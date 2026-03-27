'use client'

import { useState } from 'react'
import { changeUserRole } from '../actions'

interface Props {
  userId: string
  currentRole: string
}

export function ChangeRoleButton({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newRole: string) => {
    if (newRole === role) return
    setLoading(true)
    const result = await changeUserRole(userId, newRole as 'buyer' | 'seller')
    if (!result.error) {
      setRole(newRole)
    }
    setLoading(false)
  }

  return (
    <select
      value={role}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs px-2 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 border border-white/20 bg-white/5 text-white/80 cursor-pointer"
    >
      <option value="buyer" className="bg-[#0f0c29] text-white">Comprador</option>
      <option value="seller" className="bg-[#0f0c29] text-white">Vendedor</option>
    </select>
  )
}
