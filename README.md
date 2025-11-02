# Flashcards - Electron Study App

An Electron application built with Vite and Vue for creating and studying flashcards.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

or

```bash
yarn install
```

### Development

Run the development server with Electron:

```bash
npm run dev
```

This will:
1. Start the Vite dev server on `http://localhost:5173`
2. Launch Electron when the server is ready
3. Enable hot module replacement for fast development

### Building

Build the application for production:

```bash
npm run build
```

This will:
1. Build the Vue app using Vite
2. Package the Electron application using electron-builder

## Project Structure

```
flashcards/
├── electron/          # Electron main process
│   └── main.js       # Main Electron entry point
├── src/                # Vue application source
│   ├── App.vue       # Main Vue component
│   ├── main.js       # Vue app entry point
│   └── style.css     # Global styles
├── index.html        # HTML template
├── vite.config.js    # Vite configuration
└── package.json      # Project dependencies and scripts
```

## Technology Stack

- **Electron** - Desktop application framework
- **Vue 3** - Frontend framework
- **Vite** - Build tool and dev server

## Development Notes

- The app runs in development mode when `NODE_ENV=development` or when not packaged
- In development, Electron loads from the Vite dev server
- In production, Electron loads from the built static files in `dist/`

