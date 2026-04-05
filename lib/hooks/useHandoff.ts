'use client'
import { useState, useCallback } from 'react'
import { acceptHandoff } from '@/lib/queries/handoff'

export function useHandoff(conversationId: string) {
  const [accepting, setAccepting] = useState(false)

  const handleAccept = useCallback(async () => {
    setAccepting(true)
    try {
      await acceptHandoff(conversationId)
    } finally {
      setAccepting(false)
    }
  }, [conversationId])

  return { handleAccept, accepting }
}
