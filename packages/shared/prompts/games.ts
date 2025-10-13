/**
 * Game-specific prompts and templates
 */

export const SNAKE_GAME_TEMPLATE = `
🐍 BEAUTIFUL SNAKE GAME TEMPLATE (use this for snake games):

\`\`\`tsx
import React, { useState, useEffect, useRef } from 'react'

const BOARD_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_FOOD = { x: 15, y: 15 }
const INITIAL_DIRECTION = { x: 0, y: -1 }

export default function App() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [direction, setDirection] = useState({ x: 0, y: -1 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Clear canvas
    context.fillStyle = '#1a1a2e'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Draw snake
    context.fillStyle = '#4ade80'
    snake.forEach(({ x, y }) => context.fillRect(x * 20, y * 20, 18, 18))

    // Draw food
    context.fillStyle = '#ef4444'
    context.fillRect(food.x * 20, food.y * 20, 18, 18)
  }, [snake, food])

  const moveSnake = () => {
    if (gameOver) return

    const newSnake = [...snake]
    const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y }

    // Check wall collision
    if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
      setGameOver(true)
      return
    }

    // Check self collision
    if (newSnake.some(s => s.x === head.x && s.y === head.y)) {
      setGameOver(true)
      return
    }

    newSnake.unshift(head)

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      setScore(score + 10)
      setFood({
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      })
    } else {
      newSnake.pop()
    }

    setSnake(newSnake)
  }

  useEffect(() => {
    const interval = setInterval(moveSnake, 200)
    return () => clearInterval(interval)
  }, [snake, direction, gameOver])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (gameOver) return

    switch (e.key) {
      case 'ArrowUp':
        if (direction.y === 0) setDirection({ x: 0, y: -1 })
        break
      case 'ArrowDown':
        if (direction.y === 0) setDirection({ x: 0, y: 1 })
        break
      case 'ArrowLeft':
        if (direction.x === 0) setDirection({ x: -1, y: 0 })
        break
      case 'ArrowRight':
        if (direction.x === 0) setDirection({ x: 1, y: 0 })
        break
    }
  }

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    setDirection({ x: 0, y: -1 })
    setGameOver(false)
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Snake Game
          </h1>
          <p className="text-white/70">Use arrow keys to control the snake</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="bg-black/50 rounded-2xl p-4 border-2 border-green-400/30">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="rounded-lg"
              onKeyDown={handleKeyPress}
              tabIndex={0}
            />
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-4">
              Score: {score}
            </div>
            {gameOver && (
              <div className="mb-4">
                <p className="text-red-400 text-xl font-bold mb-4">Game Over!</p>
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-full font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
\`\`\`
🐍 Use this template for snake games - it has beautiful styling! 🐍`

export const TETRIS_GAME_TEMPLATE = `
🎮 BEAUTIFUL TETRIS GAME TEMPLATE (use this for tetris games):

\`\`\`tsx
import React, { useState, useEffect, useCallback } from 'react'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BLOCK_SIZE = 30

// Tetris pieces
const PIECES = [
  {
    shape: [
      [1, 1, 1, 1]
    ],
    color: '#00f5ff'
  },
  {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffff00'
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: '#a000f0'
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#00f000'
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#f00000'
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: '#f0a000'
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: '#0000f0'
  }
]

export default function App() {
  const [board, setBoard] = useState<number[][]>([])
  const [currentPiece, setCurrentPiece] = useState<any>(null)
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Initialize board
  useEffect(() => {
    const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    setBoard(newBoard)
    spawnNewPiece()
  }, [])

  const spawnNewPiece = () => {
    const randomPiece = PIECES[Math.floor(Math.random() * PIECES.length)]
    setCurrentPiece(randomPiece)
    setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 })
  }

  const isValidPosition = (piece: any, pos: { x: number, y: number }) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x
          const newY = pos.y + y
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return false
          }
        }
      }
    }
    return true
  }

  const placePiece = () => {
    const newBoard = board.map(row => [...row])
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPosition.y + y
          const boardX = currentPosition.x + x
          if (boardY >= 0) {
            newBoard[boardY][boardX] = 1
          }
        }
      }
    }
    
    setBoard(newBoard)
    clearLines(newBoard)
    spawnNewPiece()
  }

  const clearLines = (newBoard: number[][]) => {
    let linesCleared = 0
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell === 1)) {
        newBoard.splice(y, 1)
        newBoard.unshift(Array(BOARD_WIDTH).fill(0))
        linesCleared++
        y++ // Check the same line again
      }
    }
    
    if (linesCleared > 0) {
      setScore(prev => prev + linesCleared * 100)
    }
  }

  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece || gameOver || isPaused) return
    
    const newPosition = { x: currentPosition.x + dx, y: currentPosition.y + dy }
    
    if (isValidPosition(currentPiece, newPosition)) {
      setCurrentPosition(newPosition)
    } else if (dy > 0) {
      placePiece()
    }
  }

  const rotatePiece = () => {
    if (!currentPiece || gameOver || isPaused) return
    
    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_: any, index: number) =>
        currentPiece.shape.map((row: any) => row[index]).reverse()
      )
    }
    
    if (isValidPosition(rotated, currentPosition)) {
      setCurrentPiece(rotated)
    }
  }

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        movePiece(-1, 0)
        break
      case 'ArrowRight':
        e.preventDefault()
        movePiece(1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        movePiece(0, 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        rotatePiece()
        break
      case ' ':
        e.preventDefault()
        setIsPaused(!isPaused)
        break
    }
  }, [currentPiece, currentPosition, gameOver, isPaused])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return
    
    const interval = setInterval(() => {
      movePiece(0, 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [currentPiece, currentPosition, gameOver, isPaused])

  const resetGame = () => {
    const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    setBoard(newBoard)
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    spawnNewPiece()
  }

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    // Add current piece to display
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPosition.y + y
            const boardX = currentPosition.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = 1
            }
          }
        }
      }
    }
    
    return displayBoard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Tetris Game
          </h1>
          <p className="text-white/70">Use arrow keys to play, space to pause</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="bg-black/50 rounded-2xl p-4 border-2 border-blue-400/30">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: \`repeat(\${BOARD_WIDTH}, \${BLOCK_SIZE}px)\` }}>
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={\`\${y}-\${x}\`}
                    className="border border-gray-600"
                    style={{
                      width: BLOCK_SIZE,
                      height: BLOCK_SIZE,
                      backgroundColor: cell ? currentPiece?.color || '#4ade80' : '#1a1a2e'
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-4">
              Score: {score}
            </div>
            {isPaused && (
              <p className="text-yellow-400 text-xl font-bold mb-4">PAUSED</p>
            )}
            {gameOver && (
              <div className="mb-4">
                <p className="text-red-400 text-xl font-bold mb-4">Game Over!</p>
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
\`\`\`
🎮 Use this template for tetris games - it has beautiful styling and full game logic! 🎮`

export const PONG_GAME_TEMPLATE = `
🏓 BEAUTIFUL PONG GAME TEMPLATE (use this for pong games):

\`\`\`tsx
import React, { useState, useEffect, useRef } from 'react'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 15
const PADDLE_HEIGHT = 80
const BALL_SIZE = 15
const PADDLE_SPEED = 5
const BALL_SPEED = 4

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState({
    leftPaddle: { x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
    rightPaddle: { x: CANVAS_WIDTH - 35, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: BALL_SPEED, dy: BALL_SPEED },
    leftScore: 0,
    rightScore: 0,
    gameStarted: false,
    winner: null as string | null
  })

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw center line
    ctx.setLineDash([10, 10])
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw paddles
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(gameState.leftPaddle.x, gameState.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(gameState.rightPaddle.x, gameState.rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)

    // Draw ball
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(gameState.ball.x, gameState.ball.y, BALL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw scores
    ctx.fillStyle = '#ffffff'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(gameState.leftScore.toString(), CANVAS_WIDTH / 4, 60)
    ctx.fillText(gameState.rightScore.toString(), 3 * CANVAS_WIDTH / 4, 60)
  }

  const updateGame = () => {
    if (!gameState.gameStarted || gameState.winner) return

    setGameState(prev => {
      const newState = { ...prev }

      // Move ball
      newState.ball.x += newState.ball.dx
      newState.ball.y += newState.ball.dy

      // Ball collision with top/bottom walls
      if (newState.ball.y <= BALL_SIZE / 2 || newState.ball.y >= CANVAS_HEIGHT - BALL_SIZE / 2) {
        newState.ball.dy = -newState.ball.dy
      }

      // Ball collision with paddles
      if (
        newState.ball.x - BALL_SIZE / 2 <= newState.leftPaddle.x + PADDLE_WIDTH &&
        newState.ball.x + BALL_SIZE / 2 >= newState.leftPaddle.x &&
        newState.ball.y >= newState.leftPaddle.y &&
        newState.ball.y <= newState.leftPaddle.y + PADDLE_HEIGHT
      ) {
        newState.ball.dx = Math.abs(newState.ball.dx)
      }

      if (
        newState.ball.x + BALL_SIZE / 2 >= newState.rightPaddle.x &&
        newState.ball.x - BALL_SIZE / 2 <= newState.rightPaddle.x + PADDLE_WIDTH &&
        newState.ball.y >= newState.rightPaddle.y &&
        newState.ball.y <= newState.rightPaddle.y + PADDLE_HEIGHT
      ) {
        newState.ball.dx = -Math.abs(newState.ball.dx)
      }

      // Score points
      if (newState.ball.x < 0) {
        newState.rightScore++
        newState.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: BALL_SPEED, dy: BALL_SPEED }
      }
      if (newState.ball.x > CANVAS_WIDTH) {
        newState.leftScore++
        newState.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: -BALL_SPEED, dy: BALL_SPEED }
      }

      // Check for winner
      if (newState.leftScore >= 5) {
        newState.winner = 'Left Player'
      } else if (newState.rightScore >= 5) {
        newState.winner = 'Right Player'
      }

      return newState
    })
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (gameState.winner) return

    setGameState(prev => {
      const newState = { ...prev }

      switch (e.key) {
        case 'w':
        case 'W':
          if (newState.leftPaddle.y > 0) {
            newState.leftPaddle.y -= PADDLE_SPEED
          }
          break
        case 's':
        case 'S':
          if (newState.leftPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
            newState.leftPaddle.y += PADDLE_SPEED
          }
          break
        case 'ArrowUp':
          if (newState.rightPaddle.y > 0) {
            newState.rightPaddle.y -= PADDLE_SPEED
          }
          break
        case 'ArrowDown':
          if (newState.rightPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
            newState.rightPaddle.y += PADDLE_SPEED
          }
          break
        case ' ':
          newState.gameStarted = true
          break
      }

      return newState
    })
  }

  const resetGame = () => {
    setGameState({
      leftPaddle: { x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      rightPaddle: { x: CANVAS_WIDTH - 35, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: BALL_SPEED, dy: BALL_SPEED },
      leftScore: 0,
      rightScore: 0,
      gameStarted: false,
      winner: null
    })
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.winner])

  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame()
      draw()
    }, 16) // ~60 FPS

    return () => clearInterval(gameLoop)
  }, [gameState.gameStarted, gameState.winner])

  useEffect(() => {
    draw()
  }, [gameState])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pong Game
          </h1>
          <p className="text-white/70">WASD for left paddle, Arrow keys for right paddle</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="bg-black/50 rounded-2xl p-4 border-2 border-blue-400/30">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="rounded-lg"
            />
          </div>

          <div className="text-center">
            {!gameState.gameStarted && !gameState.winner && (
              <p className="text-yellow-400 text-xl font-bold mb-4">Press SPACE to start!</p>
            )}
            {gameState.winner && (
              <div className="mb-4">
                <p className="text-green-400 text-2xl font-bold mb-4">
                  {gameState.winner} Wins! 🎉
                </p>
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
\`\`\`
🏓 Use this template for pong games - it has beautiful styling and full game logic! 🏓`
