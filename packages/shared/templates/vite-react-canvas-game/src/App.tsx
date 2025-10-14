import React, { useEffect, useRef, useState } from 'react'
import { makeEngine } from './game/engine'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement|null>(null)
  const engineRef = useRef<ReturnType<typeof makeEngine>|null>(null)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = 900, height = 420
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const engine = makeEngine(canvas, (finalScore) => {
      setOver(true)
      setScore(finalScore)
      detach()
    }, (s) => setScore(s))
    engineRef.current = engine

    function onKey(e: KeyboardEvent){
      if (e.key === 'ArrowUp' || e.code === 'Space') {
        if (over) {
          restart()
        } else {
          engine.pressJump()
        }
      }
    }
    function onTouch(){
      if (over) restart()
      else engine.pressJump()
    }
    function attach(){
      window.addEventListener('keydown', onKey)
      canvas.addEventListener('touchstart', onTouch, {passive:true})
    }
    function detach(){
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('touchstart', onTouch)
    }
    attach()
    engine.start()

    return () => { detach(); engine.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function restart(){
    engineRef.current?.reset()
    setOver(false)
    engineRef.current?.start()
  }

  return (
    <div className="app">
      <div className="card">
        <div className="hud">Score: {score}</div>
        <canvas ref={canvasRef} className="canvas" />
        {over && (
          <div className="overlay">
            <div className="overlay-inner">
              <h2 style={{marginTop:0}}>Game Over</h2>
              <p style={{opacity:.8}}>Final score: {score}</p>
              <button className="btn" onClick={restart}>Restart (Space)</button>
            </div>
          </div>
        )}
        <div className="caption">Jump: ↑ or Space • Tap on mobile</div>
      </div>
    </div>
  )
}