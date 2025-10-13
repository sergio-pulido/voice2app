# Prompts Library

This library contains all prompts and templates used throughout the Voice2App system, organized by category for easy maintenance and updates.

## Structure

```
prompts/
├── index.ts              # Main exports
├── games.ts              # Game-specific templates (Snake, Tetris, Pong)
├── app-templates.ts      # Common app templates (Calculator, Todo, Weather)
├── ui-ux.ts              # UI/UX design guidelines and components
├── system-prompts.ts     # System prompts for different AI tasks
├── codegen-prompts.ts    # Codegen-specific configuration templates
└── README.md            # This file
```

## Categories

### 🎮 Games (`games.ts`)
- **Snake Game Template**: Complete Snake game with beautiful UI
- **Tetris Game Template**: Full Tetris implementation with modern design
- **Pong Game Template**: Classic Pong game with smooth gameplay

### 📱 App Templates (`app-templates.ts`)
- **Calculator Template**: Beautiful calculator with full functionality
- **Todo List Template**: Modern todo app with state management
- **Weather App Template**: Weather app with dynamic theming

### 🎨 UI/UX (`ui-ux.ts`)
- **Beautiful UI Guidelines**: Comprehensive design system
- **Modern Button Styles**: Pre-styled button components
- **Modern Card Styles**: Card layout patterns
- **Modern Form Styles**: Form input components
- **Modern Layout Patterns**: Common layout structures

### 🤖 System Prompts (`system-prompts.ts`)
- **Codegen System Prompt**: Main code generation instructions
- **UI/UX System Prompt**: Design-focused instructions
- **Game Development Prompt**: Game-specific development guidelines
- **App Analysis Prompt**: App analysis and metadata generation

### ⚙️ Codegen Prompts (`codegen-prompts.ts`)
- **Package.json Template**: Project configuration
- **Vite Config Templates**: Build configuration (with/without Lingo)
- **Index.html Template**: HTML structure
- **Main.tsx Template**: React entry point
- **App.tsx Template**: Main app component
- **Auth Template**: Authentication forms
- **Config Templates**: PostCSS, Tailwind, TypeScript configs

## Usage

### Importing Prompts

```typescript
import { 
  SNAKE_GAME_TEMPLATE,
  BEAUTIFUL_UI_GUIDELINES,
  CODEGEN_SYSTEM_PROMPT 
} from '../shared/prompts'
```

### Dynamic Prompt Building

The codegen generator uses a `buildSystemPrompt()` function that dynamically combines prompts based on the request type:

```typescript
function buildSystemPrompt(task: Task): string {
  let systemPrompt = CODEGEN_SYSTEM_PROMPT + '\n\n' + UI_UX_SYSTEM_PROMPT
  
  if (isGameRequest) {
    systemPrompt += '\n\n' + GAME_DEVELOPMENT_PROMPT
  }
  
  if (isSnakeRequest) {
    systemPrompt += '\n\n' + SNAKE_GAME_TEMPLATE
  }
  
  // ... more conditional additions
  
  return systemPrompt
}
```

## Benefits

### 🎯 **Centralized Management**
- All prompts in one place
- Easy to find and update
- Consistent across the system

### 🔧 **Easy Maintenance**
- Update templates once, affects all usage
- Version control for prompt changes
- Clear organization by category

### 🚀 **Better Performance**
- No duplicate prompt definitions
- Optimized prompt building
- Reduced code duplication

### 📈 **Scalability**
- Easy to add new templates
- Modular structure
- Reusable components

## Adding New Prompts

1. **Choose the right category** (games, apps, ui-ux, system, codegen)
2. **Add your prompt** to the appropriate file
3. **Export it** from the file
4. **Add to index.ts** for easy importing
5. **Update usage** in the relevant adapters

### Example: Adding a New Game Template

```typescript
// In games.ts
export const PACMAN_GAME_TEMPLATE = `
🎮 BEAUTIFUL PACMAN GAME TEMPLATE:
\`\`\`tsx
// Your template code here
\`\`\`
🎮 Use this template for Pacman games! 🎮`

// In index.ts
export * from './games'

// In generator.ts
if (task.context.toLowerCase().includes('pacman')) {
  systemPrompt += '\n\n' + PACMAN_GAME_TEMPLATE
}
```

## Best Practices

### 📝 **Writing Prompts**
- Be specific and detailed
- Include examples when helpful
- Use clear, actionable language
- Test prompts thoroughly

### 🏗️ **Template Structure**
- Include complete, working code
- Use modern, beautiful styling
- Follow best practices
- Make templates production-ready

### 🔄 **Maintenance**
- Keep prompts up-to-date
- Test changes thoroughly
- Document new additions
- Remove outdated content

## Future Enhancements

- **Prompt Versioning**: Track prompt changes over time
- **A/B Testing**: Test different prompt variations
- **Analytics**: Track prompt effectiveness
- **Dynamic Loading**: Load prompts on-demand
- **Validation**: Ensure prompt quality and consistency

---

This prompts library makes the Voice2App system more maintainable, scalable, and consistent. All prompts are now centralized and easily manageable! 🚀
