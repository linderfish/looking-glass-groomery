// apps/web/src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ImmersiveEntry } from '@/components/entry/ImmersiveEntry'

export default function EntryPage() {
  const router = useRouter()

  // Check if user has entered before (skip animation)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('wonderland-entered')
    if (hasVisited) {
      router.push('/wonderland')
    }
  }, [router])

  const handleEnter = () => {
    sessionStorage.setItem('wonderland-entered', 'true')
    router.push('/wonderland')
  }

  return <ImmersiveEntry onEnter={handleEnter} />
}
