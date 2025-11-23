"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import MindmapCanvas from "@/components/mindmap-canvas"
import { Download, Plus, Trash2 } from "lucide-react"

export default function Page() {
  const [bubbles, setBubbles] = useState<
    Array<{
      id: string
      text: string
      x: number
      y: number
      size: number
      color: string
    }>
  >([])
  const [connections, setConnections] = useState<
    Array<{
      id: string
      from: string
      to: string
    }>
  >([])
  const [inputValue, setInputValue] = useState("")
  const [selectedSize, setSelectedSize] = useState(100)
  const [selectedColor, setSelectedColor] = useState("rgb(69, 120, 240)")
  const canvasRef = useRef<HTMLDivElement>(null)

  const colors = [
    "rgb(69, 120, 240)", // Primary blue
    "rgb(167, 100, 255)", // Purple
    "rgb(255, 108, 95)", // Red
    "rgb(255, 167, 38)", // Orange
    "rgb(76, 175, 80)", // Green
    "rgb(33, 150, 243)", // Light blue
  ]

  const handleAddBubble = () => {
    if (!inputValue.trim()) return

    const newBubble = {
      id: Date.now().toString(),
      text: inputValue,
      x: Math.random() * 300,
      y: Math.random() * 300,
      size: selectedSize,
      color: selectedColor,
    }

    setBubbles([...bubbles, newBubble])
    setInputValue("")
  }

  const handleUpdateBubble = (id: string, updates: Partial<(typeof bubbles)[0]>) => {
    setBubbles(bubbles.map((bubble) => (bubble.id === id ? { ...bubble, ...updates } : bubble)))
  }

  const handleDeleteBubble = (id: string) => {
    setBubbles(bubbles.filter((bubble) => bubble.id !== id))
    setConnections(connections.filter((conn) => conn.from !== id && conn.to !== id))
  }

  const handleAddConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return
    if (
      connections.some(
        (conn) => (conn.from === fromId && conn.to === toId) || (conn.from === toId && conn.to === fromId),
      )
    ) {
      return
    }
    setConnections([...connections, { id: Date.now().toString(), from: fromId, to: toId }])
  }

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(connections.filter((conn) => conn.id !== connectionId))
  }

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const data = {
      bubbles,
      connections,
      exportDate: new Date().toISOString(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mindmap-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    setTimeout(() => {
      const svgString = new XMLSerializer().serializeToString(canvas as any)
      const canvas2d = document.createElement("canvas")
      canvas2d.width = 800
      canvas2d.height = 600
      const ctx = canvas2d.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, 800, 600)
      }
    }, 100)
  }

  const handleClear = () => {
    if (window.confirm("Clear all bubbles?")) {
      setBubbles([])
      setConnections([])
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mindmap Builder</h1>
          <p className="text-muted-foreground">
            Create an interactive mindmap by adding bubbles, connecting them with lines, and organizing your thoughts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 p-6 h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Add Bubble</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Text</label>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddBubble()}
                  placeholder="Enter bubble text..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Size</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(Number.parseInt(e.target.value))}
                    className="flex-1 h-2 rounded cursor-pointer accent-primary"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">{selectedSize}px</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">Color</label>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-full h-10 rounded-lg transition-all border-2 ${
                        selectedColor === color ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddBubble}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus size={18} />
                Add Bubble
              </Button>

              {bubbles.length > 0 && (
                <>
                  <Button onClick={handleExport} variant="outline" className="w-full gap-2 bg-transparent">
                    <Download size={18} />
                    Export
                  </Button>

                  <Button onClick={handleClear} variant="destructive" className="w-full gap-2">
                    <Trash2 size={18} />
                    Clear All
                  </Button>
                </>
              )}

              {bubbles.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium mb-3 text-foreground">Bubbles ({bubbles.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bubbles.map((bubble) => (
                      <div
                        key={bubble.id}
                        className="flex items-center justify-between p-2 rounded bg-secondary/50 group hover:bg-secondary transition-colors"
                      >
                        <span className="text-sm text-foreground truncate">{bubble.text}</span>
                        <button
                          onClick={() => handleDeleteBubble(bubble.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {connections.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium mb-3 text-foreground">Connections ({connections.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {connections.map((conn) => {
                      const fromBubble = bubbles.find((b) => b.id === conn.from)
                      const toBubble = bubbles.find((b) => b.id === conn.to)
                      return (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between p-2 rounded bg-secondary/50 group hover:bg-secondary transition-colors text-xs"
                        >
                          <span className="text-foreground truncate">
                            {fromBubble?.text} → {toBubble?.text}
                          </span>
                          <button
                            onClick={() => handleDeleteConnection(conn.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                          >
                            <Trash2 size={12} className="text-destructive" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <MindmapCanvas
              ref={canvasRef}
              bubbles={bubbles}
              connections={connections}
              onUpdateBubble={handleUpdateBubble}
              onDeleteBubble={handleDeleteBubble}
              onAddConnection={handleAddConnection}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
