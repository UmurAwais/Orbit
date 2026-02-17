# Orbit Browser

A custom desktop browser built with Electron, React, and Tailwind CSS.

## Features

- **Address Bar**: Search or enter direct URLs.
- **Navigation**: Back, Forward, and Reload controls.
- **WebView**: High-performance website rendering.
- **Premium UI**: Sleek zinc-themed interface with custom animations.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Project Structure

- `electron/`: Main process and preload scripts.
- `src/`: Renderer process (React components and styling).
- `dist/`: Build output.
