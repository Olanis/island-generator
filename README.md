# 3D Island Generator

A Python-based procedural 3D island generator that creates realistic islands with a unified sea mass. Uses Perlin noise for terrain generation and exports to OBJ format for use in 3D games and applications.

## Features

- **Procedural Generation**: Uses Perlin noise with multiple octaves for realistic terrain
- **Unified Sea Mass**: Islands are embedded in a thick, connected sea body (black colored)
- **High Resolution**: Configurable grid resolution for detailed terrain
- **Island Shaping**: Circular falloff creates natural island shapes
- **Color Coding**: 
  - Black for water/sea
  - Sandy beaches (light brown)
  - Grassy lowlands (green)
  - Rocky mountains (gray/brown)
- **OBJ Export**: Standard 3D format compatible with most 3D software and game engines
- **Customizable**: Command-line options for all generation parameters

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Olanis/island-generator.git
cd island-generator
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

Generate an island with default settings:
```bash
python island_generator.py
```

This creates `island.obj` in the current directory.

### Advanced Usage

Customize the generation parameters:
```bash
python island_generator.py --width 300 --height 300 --sea-level 0.25 --scale 60 --seed 42 --output my_island.obj
```

### Parameters

- `--width`: Width of terrain grid (default: 200)
- `--height`: Height of terrain grid (default: 200)
- `--sea-level`: Sea level threshold 0.0-1.0 (default: 0.3)
- `--sea-depth`: Depth of sea layer (default: 0.2)
- `--scale`: Noise scale - larger values create smoother terrain (default: 50.0)
- `--seed`: Random seed for reproducible generation (default: 0)
- `--output`: Output filename (default: island.obj)

### Examples

**High-resolution island:**
```bash
python island_generator.py --width 400 --height 400
```

**Multiple islands with different seeds:**
```bash
python island_generator.py --seed 1 --output island1.obj
python island_generator.py --seed 2 --output island2.obj
python island_generator.py --seed 3 --output island3.obj
```

**Large scale with lower sea level:**
```bash
python island_generator.py --width 300 --height 300 --sea-level 0.2 --scale 80
```

## Python API

You can also use the generator in your Python code:

```python
from island_generator import IslandGenerator

# Create generator
generator = IslandGenerator(
    width=200,
    height=200,
    sea_level=0.3,
    sea_depth=0.2,
    scale=50.0
)

# Generate and export
generator.generate(seed=42, output_file="my_island.obj")
```

## Technical Details

### Terrain Generation

1. **Perlin Noise**: Multi-octave Perlin noise creates the base terrain
2. **Island Mask**: Circular falloff from center creates island shape
3. **Sea Layer**: Unified thick sea surrounds all islands at sea_level
4. **Mesh Creation**: Triangulated grid with proper vertex colors

### Output Format

The OBJ file contains:
- Vertex positions (x, y, z)
- Vertex colors (r, g, b) - including black for water
- Triangular faces
- Sea bottom layer for thick water appearance

### Performance

- 200x200 grid: ~0.5-1 second
- 400x400 grid: ~2-4 seconds

## Viewing the Output

The generated OBJ file can be opened in:
- **Blender** (Free, open-source)
- **MeshLab** (Free, open-source)
- **Unity** (Game engine)
- **Unreal Engine** (Game engine)
- Any 3D modeling software that supports OBJ format

## Requirements

- Python 3.7+
- numpy
- noise

## License

This project is open source and available for use in games and other applications.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Credits

Created using Python with numpy and noise libraries for procedural generation.
