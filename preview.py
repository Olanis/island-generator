#!/usr/bin/env python3
"""
Quick visual summary of generated terrain (ASCII art preview)
Helps visualize the island before opening in a 3D viewer
"""

from island_generator import IslandGenerator
import numpy as np


def print_terrain_map(terrain, sea_level):
    """Print an ASCII representation of the terrain"""
    height, width = terrain.shape
    
    # Downsample for display if too large
    display_height = min(height, 50)
    display_width = min(width, 100)
    
    step_h = height // display_height
    step_w = width // display_width
    
    print("\nTerrain Preview (ASCII):")
    print("█ = High mountain | ▓ = Mountain | ▒ = Hills | ░ = Low land | . = Beach | ~ = Water\n")
    
    for y in range(0, height, step_h):
        line = ""
        for x in range(0, width, step_w):
            val = terrain[y][x]
            
            if val <= sea_level:
                char = "~"  # Water
            elif val <= sea_level + 0.05:
                char = "."  # Beach
            elif val <= sea_level + 0.15:
                char = "░"  # Low land
            elif val <= sea_level + 0.30:
                char = "▒"  # Hills
            elif val <= sea_level + 0.45:
                char = "▓"  # Mountain
            else:
                char = "█"  # High mountain
            
            line += char
        print(line)
    
    # Statistics
    total_cells = terrain.size
    water_cells = np.sum(terrain <= sea_level)
    land_cells = total_cells - water_cells
    
    print(f"\nStatistics:")
    print(f"  Total area: {total_cells:,} cells")
    print(f"  Water: {water_cells:,} cells ({100*water_cells/total_cells:.1f}%)")
    print(f"  Land: {land_cells:,} cells ({100*land_cells/total_cells:.1f}%)")
    print(f"  Sea level: {sea_level:.2f}")
    print(f"  Max height: {np.max(terrain):.3f}")


def main():
    """Generate terrain and show preview"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Preview island terrain before generating full OBJ"
    )
    parser.add_argument("--width", type=int, default=100, help="Width (default: 100)")
    parser.add_argument("--height", type=int, default=100, help="Height (default: 100)")
    parser.add_argument("--sea-level", type=float, default=0.3, help="Sea level (default: 0.3)")
    parser.add_argument("--seed", type=int, default=0, help="Random seed (default: 0)")
    
    args = parser.parse_args()
    
    print(f"Generating preview with seed {args.seed}...")
    
    generator = IslandGenerator(
        width=args.width,
        height=args.height,
        sea_level=args.sea_level
    )
    
    generator.generate_terrain(seed=args.seed)
    print_terrain_map(generator.terrain, generator.sea_level)
    
    print("\nTo generate full 3D OBJ file, run:")
    print(f"  python island_generator.py --seed {args.seed} --width {args.width} --height {args.height} --sea-level {args.sea_level}")


if __name__ == "__main__":
    main()
