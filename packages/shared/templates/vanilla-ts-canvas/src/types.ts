export type Box = { x: number; y: number; w: number; h: number }
export type Obstacle = Box & { vx: number; kind: 'ground' | 'bird' }

export type Model = {
  time: number
  speed: number
  score: number
  gameOver: boolean
  width: number
  height: number
  groundY: number
  player: { x: number; y: number; w: number; h: number; vy: number; onGround: boolean; coyote: number }
  obstacles: Obstacle[]
  spawnTimerGround: number
  spawnTimerBird: number
}