"use client"
import React, { useEffect, useState } from 'react'

export default function SharedGradient() {
  const [size, setSize] = useState({ w: 1200, h: 800 })

  useEffect(() => {
    function measure() {
      setSize({ w: window.innerWidth || 1200, h: window.innerHeight || 800 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  // Show a temporary visible overlay when the URL includes ?showGradient=1 or #show-gradient
  const showOverlay = typeof window !== 'undefined' && (window.location.search.includes('showGradient=1') || window.location.hash.includes('show-gradient'))
  const rectOpacity = showOverlay ? 0.35 : 0
  const svgZ = showOverlay ? 9999 : 0

  return (
    <svg aria-hidden style={{position:'fixed',left:0,top:0,width:'100vw',height:'100vh',pointerEvents:'none',zIndex:svgZ}} viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="shared-gradient" x1="0" x2={size.w} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent-a)" />
          <stop offset="48%" stopColor="var(--accent-b)" />
          <stop offset="84%" stopColor="var(--accent-c)" />
        </linearGradient>
      </defs>
      {/* Invisible rect painted with the gradient so browsers register the gradient defs. */}
      {/* When debugging, set rectOpacity > 0 to visually confirm mapping across the viewport. */}
      <rect width="100%" height="100%" fill="url(#shared-gradient)" opacity={rectOpacity} />
    </svg>
  )
}
