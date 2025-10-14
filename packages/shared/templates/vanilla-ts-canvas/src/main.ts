import { makeEngine } from './engine'

const canvas = document.getElementById('game') as HTMLCanvasElement
const overlay = document.getElementById('overlay') as HTMLDivElement
const restartBtn = document.getElementById('restart') as HTMLButtonElement
const scoreEl = document.getElementById('score') as HTMLSpanElement
const finalEl = document.getElementById('final') as HTMLSpanElement

// DPR setup
const dpr = Math.min(2, window.devicePixelRatio || 1)
const width = 900, height = 420
canvas.width = Math.floor(width * dpr)
canvas.height = Math.floor(height * dpr)
canvas.style.width = width + 'px'
canvas.style.height = height + 'px'
const ctx = canvas.getContext('2d')!
ctx.scale(dpr, dpr)

const engine = makeEngine(canvas, (finalScore) => {
  finalEl.textContent = String(finalScore)
  overlay.classList.remove('hidden')
  detach()
}, (s) => {
  scoreEl.textContent = String(s)
})

function attach(){
  window.addEventListener('keydown', onKey)
  canvas.addEventListener('touchstart', onTouch, {passive:true})
  restartBtn.addEventListener('click', restart)
}
function detach(){
  window.removeEventListener('keydown', onKey)
  canvas.removeEventListener('touchstart', onTouch)
  restartBtn.removeEventListener('click', restart)
}
function onKey(e: KeyboardEvent){
  if (e.key === 'ArrowUp' || e.code === 'Space'){
    if (overlay.classList.contains('hidden')) engine.pressJump()
    else restart()
  }
}
function onTouch(){
  if (overlay.classList.contains('hidden')) engine.pressJump()
  else restart()
}

function restart(){
  engine.reset()
  overlay.classList.add('hidden')
  engine.start()
}

attach()
engine.start()