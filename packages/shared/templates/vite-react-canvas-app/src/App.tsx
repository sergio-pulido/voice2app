import React, { useEffect, useRef, useState } from 'react'
import { makeAppEngine } from './app/engine'
import type { AppState, CanvasElement } from './app/types'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<ReturnType<typeof makeAppEngine> | null>(null)
  const [state, setState] = useState<AppState | null>(null)
  const [mode, setMode] = useState<'interact' | 'edit'>('interact')

  useEffect(() => {
    const canvas = canvasRef.current!
    
    const engine = makeAppEngine(
      canvas,
      (newState) => setState(newState),
      (elementId) => {
        console.log('Element clicked:', elementId)
      }
    )
    
    engineRef.current = engine

    function onMouseDown(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      engine.handleEvent({
        type: 'click',
        position
      })
    }

    function onResize() {
      engine.handleEvent({
        type: 'resize',
        position: { x: 0, y: 0 }
      })
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' && state?.selectedElement) {
        engine.removeElement(state.selectedElement)
      }
      if (e.key === 'Escape') {
        setMode('interact')
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)

    engine.start()

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      engine.stop()
    }
  }, [state?.selectedElement])

  function addButton() {
    if (!engineRef.current) return
    
    engineRef.current.addElement({
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      w: 120,
      h: 40,
      type: 'button',
      data: { text: 'Click Me' }
    })
  }

  function addInput() {
    if (!engineRef.current) return
    
    engineRef.current.addElement({
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      w: 200,
      h: 32,
      type: 'input',
      data: { 
        value: '',
        placeholder: 'Enter text...',
        focused: false
      }
    })
  }

  function addText() {
    if (!engineRef.current) return
    
    engineRef.current.addElement({
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      w: 0,
      h: 0,
      type: 'text',
      data: { text: 'Sample Text' }
    })
  }

  function clearCanvas() {
    if (engineRef.current) {
      engineRef.current.reset()
    }
  }

  function toggleMode() {
    setMode(mode === 'interact' ? 'edit' : 'interact')
  }

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-section">
          <h3>Canvas App</h3>
          <span className="mode-indicator">
            Mode: <strong>{mode}</strong>
          </span>
        </div>
        
        <div className="toolbar-section">
          <button 
            className={`btn ${mode === 'edit' ? 'btn-active' : ''}`}
            onClick={toggleMode}
          >
            {mode === 'edit' ? 'Exit Edit' : 'Edit Mode'}
          </button>
          {mode === 'edit' && (
            <>
              <button className="btn btn-secondary" onClick={addButton}>
                Add Button
              </button>
              <button className="btn btn-secondary" onClick={addInput}>
                Add Input
              </button>
              <button className="btn btn-secondary" onClick={addText}>
                Add Text
              </button>
              <button className="btn btn-danger" onClick={clearCanvas}>
                Clear All
              </button>
            </>
          )}
        </div>
        
        <div className="toolbar-section">
          {state?.selectedElement && (
            <span className="selected-info">
              Selected: {state.selectedElement}
            </span>
          )}
        </div>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="canvas" />
        {mode === 'edit' && (
          <div className="edit-overlay">
            <div className="edit-tip">
              Edit Mode: Click to select elements, Delete key to remove
            </div>
          </div>
        )}
      </div>

      <div className="status-bar">
        <span>Elements: {state?.elements.length || 0}</span>
        <span>Zoom: {state?.zoom.toFixed(2)}x</span>
        <span>Canvas: {state?.width}×{state?.height}</span>
      </div>
    </div>
  )
}
