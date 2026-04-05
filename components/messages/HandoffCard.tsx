'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useHandoff } from '@/lib/hooks/useHandoff'

interface HandoffCardProps {
  conversationId: string
  summary: string | null
  otherUserName: string
}

export default function HandoffCard({ conversationId, summary, otherUserName }: HandoffCardProps) {
  const { handleAccept, accepting } = useHandoff(conversationId)

  return (
    <div className="my-4 px-2">
      <Card className="border border-[#7BAEC7]/30 bg-[#EEF3FA] shadow-none">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7BAEC7] mb-2">
            Your twin found someone worth meeting
          </p>
          <p className="text-sm font-bold text-[#2D2D2D] mb-2">{otherUserName}</p>
          {summary && (
            <p className="text-sm text-[#5A5A5A] italic leading-relaxed">
              "{summary}"
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? 'Taking over...' : 'Take over'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
