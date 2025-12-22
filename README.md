# 3D Island Generator

A basic 3D island generator using Three.js that creates random island meshes with a single button click.

## Features

- Random island generation using Perlin noise
- 3D mesh visualization with realistic terrain
- Interactive camera controls (orbit controls)
- Simple UI with "Generate New Island" button
- Color-coded terrain based on elevation (sand, grass, rock)

## Quick Start / Schnellstart

### Option 1: GitHub Pages (Einfachster Weg / Easiest Way)

This repository can be deployed to GitHub Pages for easy access via a public URL.

**Schritte / Steps:**
1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select the branch `copilot/add-basic-island-generator` (or merge to `main` first)
4. Click "Save"
5. After a few minutes, your island generator will be available at:
   ```
   https://olanis.github.io/island-generator/
   ```

**Hinweis / Note:** GitHub Pages kann einige Minuten brauchen, bis die Seite live ist. / GitHub Pages may take a few minutes to go live.

### Option 2: Local Development

#### Installation

```bash
npm install
```

#### Running the Application

```bash
npm start
```

Then open your browser and navigate to `http://localhost:3000`

### Option 3: Simple File Server

If you don't want to install dependencies, you can use Python's built-in server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

## Usage / Verwendung

Click the "Generate New Island" button to create a new random island. Use your mouse to:
- Left click and drag to rotate the view / Linksklick und ziehen zum Rotieren
- Right click and drag to pan / Rechtsklick und ziehen zum Verschieben
- Scroll to zoom in/out / Scrollen zum Zoomen

## Technologies Used

- Three.js - 3D graphics library
- Perlin Noise - Procedural terrain generation
- OrbitControls - Camera manipulation
