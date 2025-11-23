"use client"

import type React from "react"
import { forwardRef, useState, useRef, useEffect, type Ref } from "react"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface Bubble {
  id: string
  text: string
  x: number
  y: number
  size: number
  color: string
}

interface Connection {
  id: string
  from: string
  to: string
}

interface MindmapCanvasProps {
  bubbles: Bubble[]
  connections: Connection[]
  onUpdateBubble: (id: string, updates: Partial<Bubble>) => void
  onDeleteBubble: (id: string) => void
  onAddConnection: (fromId: string, toId: string) => void
}

const MindmapCanvas = forwardRef<HTMLDivElement, MindmapCanvasProps>(
  ({ bubbles, connections, onUpdateBubble, onDeleteBubble, onAddConnection }, ref: Ref<HTMLDivElement>) => {
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [resizingId, setResizingId] = useState<string | null>(null)
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Handle Pointer Down (Start Drag or Resize)
    const handlePointerDown = (e: React.PointerEvent, id: string, isResize = false) => {
      e.preventDefault() // Prevent text selection and touch scrolling
      e.stopPropagation() // Stop event from reaching canvas

      // Handle connections
      if (e.shiftKey) {
        if (connectingFrom === null) {
          setConnectingFrom(id)
        } else if (connectingFrom !== id) {
          onAddConnection(connectingFrom, id)
          setConnectingFrom(null)
        }
        return
      }

      // Complete connection if active
      if (connectingFrom && connectingFrom !== id) {
        onAddConnection(connectingFrom, id)
        setConnectingFrom(null)
        return
      }

      // Start Resize
      if (isResize) {
        setResizingId(id)
        setDraggingId(null)
        e.currentTarget.setPointerCapture(e.pointerId)
        return
      }

      // Start Drag
      const bubble = bubbles.find((b) => b.id === id)
      if (!bubble) return

      setDraggingId(id)
      setResizingId(null)

      // Calculate offset relative to the bubble's top-left corner
      // Using currentTarget ensures we get the bubble's rect, not a child's
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })

      e.currentTarget.setPointerCapture(e.pointerId)
    }

    // Handle Pointer Move (Dragging or Resizing)
    const handlePointerMove = (e: React.PointerEvent, id: string) => {
      e.preventDefault()
      e.stopPropagation()

      if (draggingId === id && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - containerRect.left - dragOffset.x
        const y = e.clientY - containerRect.top - dragOffset.y
        onUpdateBubble(id, { x, y })
      }

      if (resizingId === id && containerRef.current) {
        const bubble = bubbles.find((b) => b.id === id)
        if (bubble) {
          // Calculate distance from center to mouse to determine size
          const containerRect = containerRef.current.getBoundingClientRect()
          const centerX = bubble.x + bubble.size / 2 + containerRect.left
          const centerY = bubble.y + bubble.size / 2 + containerRect.top

          const distX = e.clientX - centerX
          const distY = e.clientY - centerY

          // Use the larger component to determine radius, then double for diameter
          const radius = Math.sqrt(distX * distX + distY * distY)
          const newSize = Math.max(60, Math.min(radius * 2, 300))

          onUpdateBubble(id, { size: newSize })
        }
      }
    }

    // Handle Pointer Up (End Drag or Resize)
    const handlePointerUp = (e: React.PointerEvent, id: string) => {
      e.preventDefault()
      e.stopPropagation()

      if (draggingId === id || resizingId === id) {
        e.currentTarget.releasePointerCapture(e.pointerId)
        setDraggingId(null)
        setResizingId(null)
      }
    }

    // Handle Canvas Hover (for connection line preview)
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setConnectingFrom(null)
        }
      }
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    return (
      <div ref={ref} className="w-full h-full">
        <Card
          className="relative w-full h-[600px] bg-slate-50 border-2 border-slate-200 overflow-hidden select-none"
          onMouseMove={handleCanvasMouseMove}
        >
          {/* Canvas background */}
          <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
            <svg className="w-full h-full opacity-[0.03]">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Connections Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {connections.map((conn) => {
              const fromBubble = bubbles.find((b) => b.id === conn.from)
              const toBubble = bubbles.find((b) => b.id === conn.to)
              if (!fromBubble || !toBubble) return null

              return (
                <line
                  key={conn.id}
                  x1={fromBubble.x + fromBubble.size / 2}
                  y1={fromBubble.y + fromBubble.size / 2}
                  x2={toBubble.x + toBubble.size / 2}
                  y2={toBubble.y + toBubble.size / 2}
                  stroke="rgba(94, 110, 130, 0.6)"
                  strokeWidth="3"
                  strokeDasharray="8,5"
                  strokeLinecap="round"
                />
              )
            })}

            {/* Connection Preview Line */}
            {connectingFrom && containerRef.current && (
              <line
                x1={
                  (bubbles.find((b) => b.id === connectingFrom)?.x || 0) +
                  (bubbles.find((b) => b.id === connectingFrom)?.size || 0) / 2
                }
                y1={
                  (bubbles.find((b) => b.id === connectingFrom)?.y || 0) +
                  (bubbles.find((b) => b.id === connectingFrom)?.size || 0) / 2
                }
                x2={mousePos.x - containerRef.current.getBoundingClientRect().left}
                y2={mousePos.y - containerRef.current.getBoundingClientRect().top}
                stroke="rgba(59, 130, 246, 0.8)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {/* Bubbles Layer */}
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className={`absolute rounded-full flex items-center justify-center shadow-lg transition-shadow group touch-none
                ${draggingId === bubble.id ? "z-50 cursor-grabbing shadow-2xl scale-105" : "z-10 cursor-grab"}
                ${connectingFrom === bubble.id ? "ring-4 ring-blue-400 ring-opacity-50" : ""}
              `}
              style={{
                left: bubble.x,
                top: bubble.y,
                width: bubble.size,
                height: bubble.size,
                backgroundColor: bubble.color,
                touchAction: "none", // Critical for touch devices
              }}
              onPointerDown={(e) => handlePointerDown(e, bubble.id)}
              onPointerMove={(e) => handlePointerMove(e, bubble.id)}
              onPointerUp={(e) => handlePointerUp(e, bubble.id)}
            >
              {/* Bubble Content */}
              <div
                className="pointer-events-none p-4 text-center leading-tight text-white font-medium overflow-hidden"
                style={{ fontSize: Math.max(12, bubble.size / 10) }}
              >
                {bubble.text}
              </div>

              {/* Delete Button */}
              <button
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteBubble(bubble.id)
                }}
                onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking delete
              >
                <X size={12} />
              </button>

              {/* Resize Handle */}
              <div
                className="absolute bottom-[10%] right-[10%] w-4 h-4 bg-white/30 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 hover:bg-white/50 transition-all z-20"
                onPointerDown={(e) => handlePointerDown(e, bubble.id, true)}
                onPointerMove={(e) => handlePointerMove(e, bubble.id)}
                onPointerUp={(e) => handlePointerUp(e, bubble.id)}
              />
            </div>
          ))}

          {/* Empty State Hint */}
          {bubbles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400">
              <p>Start adding bubbles to create your mindmap</p>
            </div>
          )}

          {/* Connection Mode Hint */}
          {connectingFrom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 pointer-events-none">
              Select another bubble to connect (Shift+Click)
            </div>
          )}
        </Card>
      </div>
    )
  },
)

MindmapCanvas.displayName = "MindmapCanvas"

export default MindmapCanvas
