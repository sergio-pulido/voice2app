# Vite React Canvas App Template

A modern, flexible canvas-based productivity app template built with React, TypeScript, and Vite.

## Features

- **Canvas-based UI**: Interactive canvas with custom rendering engine
- **Element Management**: Add, edit, and remove UI elements dynamically
- **Edit & Interact Modes**: Switch between editing and interaction modes
- **TypeScript Support**: Full type safety and IntelliSense
- **Modern Styling**: Clean, responsive design with dark mode support
- **Tunnel Ready**: Pre-configured for ngrok and cloudflare tunnels

## Architecture

### Core Components

- **`App.tsx`**: Main React component with mode switching and event handling
- **`app/engine.ts`**: Canvas rendering engine with element management
- **`app/types.ts`**: TypeScript definitions for app state and elements

### Element Types

- **Button**: Interactive clickable elements
- **Input**: Text input fields with focus states
- **Text**: Static text elements
- **Drawing**: Freehand drawing capabilities (extensible)

### App Modes

1. **Interact Mode**: User interacts with elements
2. **Edit Mode**: Add, modify, and delete elements

## Usage

This template is designed as a starting point for productivity applications that need:

- Custom canvas-based interfaces
- Dynamic element creation and management
- Interactive user experiences
- Clean, modern UI design

## Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Preview production build
```

## Customization

The template is highly customizable:

- Add new element types in `app/types.ts`
- Implement rendering logic in `app/engine.ts`
- Modify UI components in `App.tsx`
- Update styles in `styles.css`

## Tunnel Configuration

The template includes proper configuration for development tunnels:

- **ngrok**: `.ngrok-free.dev` domains
- **cloudflare**: `.trycloudflare.com` domains
- **localhost**: Local development support

Perfect for rapid prototyping and testing with external services.
