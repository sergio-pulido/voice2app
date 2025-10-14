import type { Model, Obstacle, Box } from './types'

const GRAVITY = 2000
const JUMP_V = -650
const COYOTE_TIME = 0.08

export function initModel(width: number, height: number): Model {
  const groundY = height - 60
  return {
    time: 0,
    speed: 220,
    score: 0,
    gameOver: false,
    width, height, groundY,
    player: { x: 80, y: groundY - 42, w: 32, h: 42, vy: 0, onGround: true, coyote: 0 },
    obstacles: [],
    spawnTimerGround: 0.0,
    spawnTimerBird: 1.2
  }
}

export type Engine = {
  start: () => void
  stop: () => void
  reset: () => void
  pressJump: () => void
}

export function makeEngine(
  canvas: HTMLCanvasElement,
  onEnd: (score: number) => void,
  onTick?: (score: number) => void
): Engine {
  const ctx = canvas.getContext('2d')!
  const model: Model = initModel(canvas.width, canvas.height)

  let raf = 0
  let last = 0

  function reset() {
    const m = initModel(canvas.width, canvas.height)
    Object.assign(model, m)
    draw(ctx, model)
  }

  function start() {
    cancelAnimationFrame(raf)
    last = performance.now()
    loop(last)
  }

  function stop() {
    cancelAnimationFrame(raf)
  }

  function pressJump() {
    if (model.gameOver) return
    if (model.player.onGround || model.player.coyote > 0) {
      model.player.vy = JUMP_V
      model.player.onGround = false
      model.player.coyote = 0
    }
  }

  function loop(t: number) {
    const dt = Math.min((t - last) / 1000, 0.033)
    last = t
    step(model, dt)
    draw(ctx, model)
    onTick?.(model.score)
    if (model.gameOver) {
      onEnd(model.score)
      return
    }
    raf = requestAnimationFrame(loop)
  }

  // input helpers bound outside
  return { start, stop, reset, pressJump }
}

export function step(m: Model, dt: number) {
  m.time += dt
  // difficulty curve
  m.speed = 220 + Math.min(380, m.time * 18)

  // spawn logic
  m.spawnTimerGround -= dt
  m.spawnTimerBird -= dt

  const groundInterval = Math.max(0.55, 1.6 - m.time * 0.05)
  const birdInterval   = Math.max(0.8,  2.0 - m.time * 0.04)

  if (m.spawnTimerGround <= 0) {
    spawn(m, 'ground')
    m.spawnTimerGround = groundInterval * (0.6 + Math.random() * 0.8)
  }
  if (m.spawnTimerBird <= 0) {
    spawn(m, 'bird')
    m.spawnTimerBird = birdInterval * (0.6 + Math.random() * 0.8)
  }

  // update obstacles
  for (const o of m.obstacles) {
    o.x -= (m.speed) * dt
  }
  // prune off-screen
  m.obstacles = m.obstacles.filter(o => o.x + o.w > -10)

  // physics player
  const p = m.player
  p.vy += GRAVITY * dt
  p.y += p.vy * dt

  // ground collision
  const floorY = m.groundY - p.h
  if (p.y >= floorY) {
    p.y = floorY
    p.vy = 0
    if (!p.onGround) {
      p.onGround = true
    }
  } else {
    if (p.onGround) {
      p.onGround = false
      p.coyote = COYOTE_TIME
    } else if (p.coyote > 0) {
      p.coyote -= dt
    }
  }

  // collisions
  for (const o of m.obstacles) {
    if (overlap({x:p.x,y:p.y,w:p.w,h:p.h}, o)) {
      m.gameOver = true
      break
    }
  }

  // scoring
  m.score += Math.floor(dt * 100)
}

function spawn(m: Model, kind: 'ground' | 'bird') {
  if (kind === 'ground') {
    const w = 26 + Math.floor(Math.random()*16)
    const h = 24 + Math.floor(Math.random()*18)
    const o: Obstacle = { kind, x: m.width + 10, y: m.groundY - h, w, h, vx: -m.speed }
    m.obstacles.push(o)
  } else {
    const h = 22
    const w = 28
    const y = m.groundY - (120 + Math.random()*120)
    const o: Obstacle = { kind, x: m.width + 10, y, w, h, vx: -m.speed*1.1 }
    m.obstacles.push(o)
  }
}

function overlap(a: Box, b: Box) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function draw(ctx: CanvasRenderingContext2D, m: Model) {
  const { width, height } = ctx.canvas
  // sky
  const g = ctx.createLinearGradient(0,0,0,height)
  g.addColorStop(0, '#0f1a44')
  g.addColorStop(1, '#050b20')
  ctx.fillStyle = g
  ctx.fillRect(0,0,width,height)

  // stars
  ctx.fillStyle = '#9ad9ff88'
  for (let i=0;i<40;i++) {
    const x = (i*73 + Math.floor(m.time*30)) % width
    const y = (i*53) % (height-80)
    ctx.fillRect(x, y, 2, 2)
  }

  // ground
  ctx.fillStyle = '#16203f'
  ctx.fillRect(0, m.groundY, width, height - m.groundY)
  ctx.strokeStyle = '#223060'
  ctx.lineWidth = 2
  for (let x=0;x<width;x+=24){
    ctx.beginPath()
    ctx.moveTo(x - (m.time*120)%24, m.groundY)
    ctx.lineTo(x - (m.time*120)%24 + 12, m.groundY+6)
    ctx.stroke()
  }

  // player (pixel robot)
  robot(ctx, m.player.x, m.player.y, m.player.w, m.player.h, m.time)

  // obstacles
  for (const o of m.obstacles) {
    if (o.kind === 'ground') {
      ctx.fillStyle = '#7ef0ff'
      ctx.fillRect(o.x, o.y, o.w, o.h)
      ctx.fillStyle = '#2b386b'
      ctx.fillRect(o.x+4, o.y+o.h-6, o.w-8, 4)
    } else {
      bird(ctx, o.x, o.y, o.w, o.h, m.time)
    }
  }
}

function robot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number){
  // body
  ctx.fillStyle = '#86f3ff'
  ctx.fillRect(x, y, w, h)
  // face
  ctx.fillStyle = '#0b1020'
  ctx.fillRect(x+6, y+8, w-12, 10)
  // eyes blink
  const blink = Math.floor(t*2)%6===0
  ctx.fillStyle = blink ? '#0b1020' : '#c9fff7'
  ctx.fillRect(x+10, y+10, 4, 4)
  ctx.fillRect(x+w-14, y+10, 4, 4)
  // antenna
  ctx.fillStyle = '#86f3ff'
  ctx.fillRect(x+w/2-2, y-6, 4, 6)
  ctx.fillStyle = '#ff69b4'
  ctx.fillRect(x+w/2-2, y-8, 4, 2)
  // legs (simple running illusion)
  const phase = Math.sin(t*12)
  ctx.fillStyle = '#63b6ff'
  ctx.fillRect(x+6, y+h-6, 8, 6 + (phase>0?2:0))
  ctx.fillRect(x+w-14, y+h-6, 8, 6 + (phase<0?2:0))
}

function bird(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number){
  ctx.fillStyle = '#ffe081'
  ctx.fillRect(x, y, w, h)
  // wing flap
  ctx.fillStyle = '#d0a33a'
  const flap = Math.sin(t*18) > 0 ? -6 : 6
  ctx.fillRect(x+4, y+2+flap, w-8, 6)
  // eye
  ctx.fillStyle = '#0b1020'
  ctx.fillRect(x+w-6, y+6, 3, 3)
}