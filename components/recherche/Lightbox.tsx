// -*- coding: utf-8 -*-
// components/Lightbox.tsx
// Visionneuse photo ultra simple, sans dépendance externe.
// Usage : <Lightbox open={open} photos={urls} index={start} onClose={() => setOpen(false)} />

import React, { useEffect, useRef, useState } from 'react'

type LightboxProps = {
  open: boolean
  photos: string[]
  index?: number
  onClose: () => void
}

export default function Lightbox({ open, photos, index = 0, onClose }: LightboxProps) {
  const [i, setI] = useState(index)
  const startX = useRef<number | null>(null)

  useEffect(() => { setI(index) }, [index])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, photos.length - 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, photos.length, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (startX.current === null) return
        const dx = e.changedTouches[0].clientX - startX.current
        if (dx < -40) setI((v) => Math.min(v + 1, photos.length - 1))
        if (dx > 40) setI((v) => Math.max(v - 1, 0))
        startX.current = null
      }}
    >
      <img
        src={photos[i]}
        alt={`photo ${i + 1}/${photos.length}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 12 }}
      />
      {/* Flèches cliquables (zones larges pour mobile) */}
{/* Flèche gauche */}
<button
  onClick={(e) => { e.stopPropagation(); setI((v) => Math.max(v - 1, 0)) }}
  aria-label="Précédent"
  style={{
    position: 'fixed', left: 10, top: '50%', transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: 20, fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
  }}
>‹</button>

{/* Flèche droite */}
<button
  onClick={(e) => { e.stopPropagation(); setI((v) => Math.min(v + 1, photos.length - 1)) }}
  aria-label="Suivant"
  style={{
    position: 'fixed', right: 10, top: '50%', transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: 20, fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
  }}
>›</button>

    </div>
  )
}
