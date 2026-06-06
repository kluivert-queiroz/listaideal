'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <Input value={url} readOnly className="text-sm font-mono" />
      <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
        {copied ? 'Copiado!' : 'Copiar'}
      </Button>
    </div>
  )
}
