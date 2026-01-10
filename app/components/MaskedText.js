"use client"
import React, { useEffect, useState, useId, useRef } from 'react'

export default function MaskedText({ text, className = '', size = 48, weight = 800 }) {
  const id = useId()
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [svgWidth, setSvgWidth] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    function measure() {
      const container = containerRef.current
      if (container) {
        const w = Math.max(Math.round(container.getBoundingClientRect().width), 32)
        setSvgWidth(w)
        setHydrated(true)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const fontSize = size
  const svgHeight = Math.round(fontSize * 1.2)

  return (
    <span ref={containerRef} className={`masked-text ${className} ${hydrated ? 'hydrated' : 'not-hydrated'}`} style={{display:'inline-block', position:'relative'}}>
      <svg ref={svgRef} width={'100%'} height={svgHeight} viewBox={`0 0 ${svgWidth || 1000} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" aria-hidden style={{display:'block', position:'relative', zIndex:1}}>
        <text x="50%" y="65%" textAnchor="middle" fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" fontWeight={weight} fontSize={fontSize} fill={`url(#shared-gradient)`}>{text}</text>
      </svg>
      <span className="masked-copy" aria-hidden>{text}</span>
      <span className="sr-only">{text}</span>
    </span>
  )
}
