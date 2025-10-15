import type { AppState, AppEvent, CanvasElement, Vec2 } from './types'

export function makeAppEngine(
  canvas: HTMLCanvasElement,
  onStateChange: (state: AppState) => void,
  onElementClick?: (elementId: string) => void
) {
  let state: AppState = {
    width: 800,
    height: 600,
    elements: [],
    selectedElement: null,
    mode: 'interact',
    zoom: 1,
    pan: { x: 0, y: 0 }
  }

  let ctx = canvas.getContext('2d')!
  let animationId: number

  function updateCanvasSize() {
    const rect = canvas.getBoundingClientRect()
    state.width = rect.width
    state.height = rect.height
    canvas.width = state.width * window.devicePixelRatio
    canvas.height = state.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  function render() {
    ctx.clearRect(0, 0, state.width, state.height)
    
    // Apply zoom and pan
    ctx.save()
    ctx.translate(state.pan.x, state.pan.y)
    ctx.scale(state.zoom, state.zoom)
    
    // Render background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(-state.pan.x / state.zoom, -state.pan.y / state.zoom, state.width / state.zoom, state.height / state.zoom)
    
    // Render elements
    state.elements.forEach(element => {
      renderElement(element)
    })
    
    ctx.restore()
  }

  function renderElement(element: CanvasElement) {
    const isSelected = state.selectedElement === element.id
    
    switch (element.type) {
      case 'button':
        // Button background
        ctx.fillStyle = isSelected ? '#3b82f6' : '#e5e7eb'
        ctx.fillRect(element.x, element.y, element.w, element.h)
        
        // Button border
        ctx.strokeStyle = isSelected ? '#1d4ed8' : '#9ca3af'
        ctx.lineWidth = 2
        ctx.strokeRect(element.x, element.y, element.w, element.h)
        
        // Button text
        ctx.fillStyle = isSelected ? '#ffffff' : '#374151'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          element.data?.text || 'Button',
          element.x + element.w / 2,
          element.y + element.h / 2
        )
        break
        
      case 'input':
        // Input background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(element.x, element.y, element.w, element.h)
        
        // Input border
        ctx.strokeStyle = element.data?.focused ? '#3b82f6' : '#d1d5db'
        ctx.lineWidth = 2
        ctx.strokeRect(element.x, element.y, element.w, element.h)
        
        // Input text
        ctx.fillStyle = '#374151'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const text = element.data?.value || element.data?.placeholder || ''
        ctx.fillText(text, element.x + 8, element.y + element.h / 2)
        break
        
      case 'text':
        ctx.fillStyle = '#374151'
        ctx.font = '16px system-ui'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(element.data?.text || 'Text', element.x, element.y)
        break
        
      case 'drawing':
        if (element.data?.path) {
          ctx.strokeStyle = element.data?.color || '#374151'
          ctx.lineWidth = element.data?.lineWidth || 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          
          ctx.beginPath()
          element.data.path.forEach((point: Vec2, index: number) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y)
            } else {
              ctx.lineTo(point.x, point.y)
            }
          })
          ctx.stroke()
        }
        break
    }
    
    // Selection indicator
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(element.x - 2, element.y - 2, element.w + 4, element.h + 4)
      ctx.setLineDash([])
    }
  }

  function handleEvent(event: AppEvent) {
    switch (event.type) {
      case 'click':
        const clickedElement = findElementAt(event.position)
        if (clickedElement) {
          state.selectedElement = clickedElement.id
          onElementClick?.(clickedElement.id)
        } else {
          state.selectedElement = null
        }
        break
        
      case 'resize':
        updateCanvasSize()
        break
    }
    
    onStateChange(state)
  }

  function findElementAt(position: Vec2): CanvasElement | null {
    // Convert screen coordinates to canvas coordinates considering zoom and pan
    const canvasX = (position.x - state.pan.x) / state.zoom
    const canvasY = (position.y - state.pan.y) / state.zoom
    
    // Find element from back to front (reverse order)
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const element = state.elements[i]
      if (canvasX >= element.x && canvasX <= element.x + element.w &&
          canvasY >= element.y && canvasY <= element.y + element.h) {
        return element
      }
    }
    return null
  }

  function addElement(element: Omit<CanvasElement, 'id'>) {
    const newElement: CanvasElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    state.elements.push(newElement)
    onStateChange(state)
  }

  function updateElement(id: string, updates: Partial<CanvasElement>) {
    const index = state.elements.findIndex(el => el.id === id)
    if (index !== -1) {
      state.elements[index] = { ...state.elements[index], ...updates }
      onStateChange(state)
    }
  }

  function removeElement(id: string) {
    state.elements = state.elements.filter(el => el.id !== id)
    if (state.selectedElement === id) {
      state.selectedElement = null
    }
    onStateChange(state)
  }

  function start() {
    updateCanvasSize()
    render()
    
    function animate() {
      render()
      animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  }

  function reset() {
    state = {
      width: 800,
      height: 600,
      elements: [],
      selectedElement: null,
      mode: 'interact',
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
    onStateChange(state)
  }

  return {
    state: () => state,
    handleEvent,
    addElement,
    updateElement,
    removeElement,
    start,
    stop,
    reset
  }
}
