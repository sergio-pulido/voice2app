/**
 * Common app templates and patterns
 */

export const CALCULATOR_TEMPLATE = `
🧮 BEAUTIFUL CALCULATOR TEMPLATE:

\`\`\`tsx
import React, { useState } from 'react'

export default function App() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForNewValue(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '×':
        return firstValue * secondValue
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0
      default:
        return secondValue
    }
  }

  const performCalculation = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.')
      setWaitingForNewValue(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const buttons = [
    { label: 'C', onClick: clear, className: 'bg-red-500 hover:bg-red-600' },
    { label: '±', onClick: () => setDisplay(String(-parseFloat(display))), className: 'bg-gray-500 hover:bg-gray-600' },
    { label: '%', onClick: () => setDisplay(String(parseFloat(display) / 100)), className: 'bg-gray-500 hover:bg-gray-600' },
    { label: '÷', onClick: () => inputOperation('÷'), className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '7', onClick: () => inputNumber('7'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '8', onClick: () => inputNumber('8'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '9', onClick: () => inputNumber('9'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '×', onClick: () => inputOperation('×'), className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '4', onClick: () => inputNumber('4'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '5', onClick: () => inputNumber('5'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '6', onClick: () => inputNumber('6'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '-', onClick: () => inputOperation('-'), className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '1', onClick: () => inputNumber('1'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '2', onClick: () => inputNumber('2'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '3', onClick: () => inputNumber('3'), className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '+', onClick: () => inputOperation('+'), className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '0', onClick: () => inputNumber('0'), className: 'bg-gray-700 hover:bg-gray-600 col-span-2' },
    { label: '.', onClick: inputDecimal, className: 'bg-gray-700 hover:bg-gray-600' },
    { label: '=', onClick: performCalculation, className: 'bg-orange-500 hover:bg-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Calculator</h1>
          <p className="text-white/70">Beautiful and functional calculator</p>
        </div>

        <div className="bg-black/50 rounded-2xl p-6 border-2 border-blue-400/30">
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="text-right text-3xl font-mono text-white min-h-[2rem]">
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={\`\${button.className} text-white text-xl font-bold py-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95\`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
\`\`\`
🧮 Use this template for calculator apps - it has beautiful styling and full functionality! 🧮`

export const TODO_LIST_TEMPLATE = `
✅ BEAUTIFUL TODO LIST TEMPLATE:

\`\`\`tsx
import React, { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date()
      }
      setTodos([todo, ...todos])
      setNewTodo('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed
      case 'completed':
        return todo.completed
      default:
        return true
    }
  })

  const completedCount = todos.filter(todo => todo.completed).length
  const activeCount = todos.length - completedCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Todo List</h1>
          <p className="text-white/70">Stay organized and productive</p>
        </div>

        {/* Add Todo Form */}
        <div className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
            <button
              onClick={addTodo}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white">{todos.length}</div>
            <div className="text-white/70 text-sm">Total</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white">{activeCount}</div>
            <div className="text-white/70 text-sm">Active</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white">{completedCount}</div>
            <div className="text-white/70 text-sm">Completed</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'completed'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={\`px-4 py-2 rounded-lg font-medium transition-all duration-300 \${filter === filterType 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'\`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="space-y-3 mb-6">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/50 text-lg">No todos found</div>
              <div className="text-white/30 text-sm mt-2">
                {filter === 'all' ? 'Add a todo to get started!' : \`No \${filter} todos\`}
              </div>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={\`bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 transition-all duration-300 \${todo.completed ? 'opacity-60' : ''}\`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 \${todo.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-white/30 hover:border-green-500'\`}
                  >
                    {todo.completed && <span className="text-white text-sm">✓</span>}
                  </button>
                  <span className={\`flex-1 \${todo.completed ? 'line-through text-white/50' : 'text-white'}\`}>
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear Completed */}
        {completedCount > 0 && (
          <div className="text-center">
            <button
              onClick={clearCompleted}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
            >
              Clear Completed ({completedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
\`\`\`
✅ Use this template for todo list apps - it has beautiful styling and full functionality! ✅`

export const WEATHER_APP_TEMPLATE = `
🌤️ BEAUTIFUL WEATHER APP TEMPLATE:

\`\`\`tsx
import React, { useState, useEffect } from 'react'

interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [city, setCity] = useState('London')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Mock weather data (replace with real API)
  const fetchWeather = async (cityName: string) => {
    setLoading(true)
    setError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockWeather: WeatherData = {
        location: cityName,
        temperature: Math.floor(Math.random() * 30) + 5,
        description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        icon: '☀️'
      }
      
      setWeather(mockWeather)
    } catch (err) {
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(city)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (city.trim()) {
      fetchWeather(city.trim())
    }
  }

  const getWeatherIcon = (description: string) => {
    switch (description.toLowerCase()) {
      case 'sunny':
        return '☀️'
      case 'cloudy':
        return '☁️'
      case 'rainy':
        return '🌧️'
      case 'partly cloudy':
        return '⛅'
      default:
        return '🌤️'
    }
  }

  const getBackgroundGradient = (description: string) => {
    switch (description.toLowerCase()) {
      case 'sunny':
        return 'from-yellow-400 via-orange-500 to-red-500'
      case 'cloudy':
        return 'from-gray-400 via-gray-500 to-gray-600'
      case 'rainy':
        return 'from-blue-400 via-blue-500 to-blue-600'
      default:
        return 'from-slate-900 via-purple-900 to-slate-900'
    }
  }

  return (
    <div className={\`min-h-screen bg-gradient-to-br \${weather ? getBackgroundGradient(weather.description) : 'from-slate-900 via-purple-900 to-slate-900'} flex items-center justify-center p-4\`}>
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Weather App</h1>
          <p className="text-white/70">Check the weather anywhere</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name"
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Weather Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg">Loading weather data...</div>
          </div>
        )}

        {weather && !loading && (
          <div className="space-y-6">
            {/* Main Weather Info */}
            <div className="text-center">
              <div className="text-6xl mb-4">{getWeatherIcon(weather.description)}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{weather.location}</h2>
              <div className="text-6xl font-bold text-white mb-2">{weather.temperature}°C</div>
              <div className="text-xl text-white/70">{weather.description}</div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-2xl mb-1">💧</div>
                <div className="text-lg font-bold text-white">{weather.humidity}%</div>
                <div className="text-white/70 text-sm">Humidity</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-2xl mb-1">💨</div>
                <div className="text-lg font-bold text-white">{weather.windSpeed} km/h</div>
                <div className="text-white/70 text-sm">Wind Speed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
\`\`\`
🌤️ Use this template for weather apps - it has beautiful styling and dynamic theming! 🌤️`
