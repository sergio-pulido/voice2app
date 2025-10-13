/**
 * UI/UX design prompts and guidelines
 */

export const BEAUTIFUL_UI_GUIDELINES = `
🎨 BEAUTIFUL UI/UX DESIGN GUIDELINES:

CRITICAL: Always create modern, beautiful, and professional-looking applications with:

1. **Modern Design System:**
   - Use gradient backgrounds (bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900)
   - Glass morphism effects (bg-white/10 backdrop-blur-lg)
   - Rounded corners (rounded-3xl, rounded-2xl)
   - Subtle borders (border border-white/20)
   - Beautiful shadows (shadow-2xl)

2. **Typography:**
   - Large, bold headings (text-4xl font-bold)
   - Proper text hierarchy
   - Good contrast (text-white, text-white/70)
   - Readable font sizes

3. **Color Palette:**
   - Primary: Blue gradients (#3b82f6, #1d4ed8)
   - Success: Green gradients (#10b981, #059669)
   - Warning: Yellow/Orange gradients (#f59e0b, #d97706)
   - Error: Red gradients (#ef4444, #dc2626)
   - Background: Dark gradients with transparency

4. **Interactive Elements:**
   - Hover effects (hover:from-blue-600 hover:to-purple-600)
   - Smooth transitions (transition-all duration-300)
   - Button gradients (bg-gradient-to-r from-blue-500 to-purple-500)
   - Interactive feedback

5. **Layout:**
   - Centered content (flex items-center justify-center)
   - Proper spacing (p-8, space-y-6, mb-8)
   - Responsive design (p-4, min-h-screen)
   - Card-based layouts

6. **Visual Hierarchy:**
   - Clear section separation
   - Proper use of whitespace
   - Consistent spacing
   - Focus on important elements

7. **Accessibility:**
   - Good color contrast
   - Proper focus states
   - Semantic HTML
   - Keyboard navigation

ALWAYS apply these guidelines to create stunning, professional applications! 🎨`

export const MODERN_BUTTON_STYLES = `
🔘 MODERN BUTTON STYLES:

Primary Button:
\`\`\`tsx
<button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg">
  Button Text
</button>
\`\`\`

Secondary Button:
\`\`\`tsx
<button className="bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-full font-bold hover:bg-white/20 transition-all duration-300 border border-white/20">
  Button Text
</button>
\`\`\`

Success Button:
\`\`\`tsx
<button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-full font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg">
  Button Text
</button>
\`\`\`

Danger Button:
\`\`\`tsx
<button className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg">
  Button Text
</button>
\`\`\`
`

export const MODERN_CARD_STYLES = `
🃏 MODERN CARD STYLES:

Main Container Card:
\`\`\`tsx
<div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
  {/* Card content */}
</div>
\`\`\`

Content Card:
\`\`\`tsx
<div className="bg-black/50 rounded-2xl p-4 border-2 border-blue-400/30">
  {/* Card content */}
</div>
\`\`\`

Info Card:
\`\`\`tsx
<div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
  {/* Card content */}
</div>
\`\`\`
`

export const MODERN_FORM_STYLES = `
📝 MODERN FORM STYLES:

Input Field:
\`\`\`tsx
<input 
  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
  placeholder="Enter text..."
/>
\`\`\`

Textarea:
\`\`\`tsx
<textarea 
  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
  placeholder="Enter text..."
  rows={4}
/>
\`\`\`

Select Dropdown:
\`\`\`tsx
<select className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
  <option value="">Select an option</option>
</select>
\`\`\`
`

export const MODERN_LAYOUT_PATTERNS = `
🏗️ MODERN LAYOUT PATTERNS:

Hero Section:
\`\`\`tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-white mb-2">App Title</h1>
      <p className="text-white/70">App description</p>
    </div>
    {/* Content */}
  </div>
</div>
\`\`\`

Grid Layout:
\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
\`\`\`

Flex Layout:
\`\`\`tsx
<div className="flex flex-col items-center space-y-6">
  {/* Flex items */}
</div>
\`\`\`

Sidebar Layout:
\`\`\`tsx
<div className="flex min-h-screen">
  <div className="w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 p-6">
    {/* Sidebar content */}
  </div>
  <div className="flex-1 p-6">
    {/* Main content */}
  </div>
</div>
\`\`\`
`
