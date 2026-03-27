'use client'

import { useState } from 'react'
import { addVendorReply } from '../actions'

export function VendorReplyForm({ reviewId }: { reviewId: string }) {
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await addVendorReply(reviewId, reply)
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return <p className="text-sm text-emerald-400 mt-2">Respuesta enviada correctamente</p>
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <input
        value={reply}
        onChange={e => setReply(e.target.value)}
        className="flex-1 bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg border border-white/20"
        placeholder="Escribe tu respuesta..."
      />
      <button
        type="submit"
        disabled={submitting || !reply.trim()}
        className="bg-[#7c3aed] text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
      >
        {submitting ? '...' : 'Responder'}
      </button>
    </form>
  )
}
