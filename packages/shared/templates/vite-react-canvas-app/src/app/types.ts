export type Vec2 = { x: number; y: number }
export type Box = { x: number; y: number; w: number; h: number }

// Common UI element types
export type Button = Box & {
  id: string
  text: string
  active: boolean
  onClick: () => void
}

export type Input = Box & {
  id: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  focused: boolean
}

export type CanvasElement = Box & {
  id: string
  type: 'button' | 'input' | 'text' | 'image' | 'drawing'
  data?: any
}

// App state management
export type AppState = {
  width: number
  height: number
  elements: CanvasElement[]
  selectedElement: string | null
  mode: 'edit' | 'interact'
  zoom: number
  pan: Vec2
}

// Event types
export type AppEvent = {
  type: 'click' | 'drag' | 'keypress' | 'resize'
  position: Vec2
  data?: any
}
