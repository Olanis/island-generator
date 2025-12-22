#!/usr/bin/env python3
"""
3D Island Generator - Creates procedural islands with a unified sea mass
Uses Perlin noise for terrain generation and exports to OBJ format
"""

import numpy as np
from noise import pnoise2
import sys


class IslandGenerator:
    """Generates 3D island terrain with a unified sea layer"""
    
    def __init__(self, width=200, height=200, sea_level=0.3, sea_depth=0.2, 
                 scale=50.0, octaves=6, persistence=0.5, lacunarity=2.0):
        """
        Initialize the island generator
        
        Args:
            width: Width of the terrain grid
            height: Height of the terrain grid
            sea_level: Height threshold for water (0.0-1.0)
            sea_depth: Depth of the sea layer below sea_level
            scale: Scale of the noise (larger = smoother terrain)
            octaves: Number of noise octaves (more = more detail)
            persistence: Amplitude decrease per octave
            lacunarity: Frequency increase per octave
        """
        self.width = width
        self.height = height
        self.sea_level = sea_level
        self.sea_depth = sea_depth
        self.scale = scale
        self.octaves = octaves
        self.persistence = persistence
        self.lacunarity = lacunarity
        
        self.terrain = None
        self.vertices = []
        self.faces = []
        self.colors = []
        
    def generate_noise_map(self, seed=0):
        """Generate a 2D noise map using Perlin noise"""
        noise_map = np.zeros((self.height, self.width))
        
        for y in range(self.height):
            for x in range(self.width):
                # Normalize coordinates
                nx = x / self.width
                ny = y / self.height
                
                # Generate Perlin noise
                noise_val = pnoise2(
                    nx * self.scale + seed,
                    ny * self.scale + seed,
                    octaves=self.octaves,
                    persistence=self.persistence,
                    lacunarity=self.lacunarity,
                    repeatx=1024,
                    repeaty=1024,
                    base=0
                )
                
                # Apply island mask (circular falloff from center)
                center_x = self.width / 2
                center_y = self.height / 2
                dist_x = (x - center_x) / center_x
                dist_y = (y - center_y) / center_y
                distance = np.sqrt(dist_x * dist_x + dist_y * dist_y)
                
                # Smooth falloff for island shape
                falloff = 1.0 - np.clip(distance * 1.2, 0.0, 1.0)
                falloff = falloff ** 2
                
                # Combine noise with falloff
                noise_map[y][x] = (noise_val + 1) / 2 * falloff
        
        return noise_map
    
    def generate_terrain(self, seed=0):
        """Generate the complete terrain including islands and sea"""
        print(f"Generating terrain with dimensions {self.width}x{self.height}...")
        self.terrain = self.generate_noise_map(seed)
        
        # Normalize terrain
        min_val = np.min(self.terrain)
        max_val = np.max(self.terrain)
        if max_val > min_val:
            self.terrain = (self.terrain - min_val) / (max_val - min_val)
        
        print(f"Terrain generated. Min: {np.min(self.terrain):.3f}, Max: {np.max(self.terrain):.3f}")
        
    def create_mesh(self):
        """Create 3D mesh from terrain data"""
        print("Creating 3D mesh...")
        
        self.vertices = []
        self.faces = []
        self.colors = []
        
        # Create heightmap vertices
        vertex_map = {}
        vertex_index = 0
        
        for y in range(self.height):
            for x in range(self.width):
                height_val = self.terrain[y][x]
                
                # Calculate vertex position
                if height_val > self.sea_level:
                    z = height_val
                else:
                    z = self.sea_level - self.sea_depth
                
                vertex = (x, z, y)
                self.vertices.append(vertex)
                
                # Assign color (black for water, gradient for land)
                if height_val <= self.sea_level:
                    # Black for water
                    color = (0.0, 0.0, 0.0)
                else:
                    # Green/brown gradient for land
                    land_height = (height_val - self.sea_level) / (1.0 - self.sea_level)
                    if land_height < 0.3:
                        # Beach/sand - light brown
                        color = (0.76, 0.70, 0.50)
                    elif land_height < 0.6:
                        # Grass - green
                        color = (0.13, 0.55, 0.13)
                    else:
                        # Mountain - gray/brown
                        color = (0.55, 0.47, 0.37)
                
                self.colors.append(color)
                vertex_map[(x, y)] = vertex_index
                vertex_index += 1
        
        # Create faces (triangles)
        for y in range(self.height - 1):
            for x in range(self.width - 1):
                # Two triangles per quad
                v1 = vertex_map[(x, y)]
                v2 = vertex_map[(x + 1, y)]
                v3 = vertex_map[(x + 1, y + 1)]
                v4 = vertex_map[(x, y + 1)]
                
                # First triangle
                self.faces.append((v1, v2, v3))
                # Second triangle
                self.faces.append((v1, v3, v4))
        
        # Add sea bottom plane for thick sea layer
        bottom_offset = vertex_index
        for y in range(self.height):
            for x in range(self.width):
                z = self.sea_level - self.sea_depth - 0.1  # Slightly below sea
                vertex = (x, z, y)
                self.vertices.append(vertex)
                self.colors.append((0.0, 0.0, 0.0))  # Black
        
        # Create sea bottom faces
        for y in range(self.height - 1):
            for x in range(self.width - 1):
                v1 = bottom_offset + y * self.width + x
                v2 = bottom_offset + y * self.width + (x + 1)
                v3 = bottom_offset + (y + 1) * self.width + (x + 1)
                v4 = bottom_offset + (y + 1) * self.width + x
                
                # First triangle (flipped for bottom)
                self.faces.append((v1, v3, v2))
                # Second triangle (flipped for bottom)
                self.faces.append((v1, v4, v3))
        
        print(f"Mesh created: {len(self.vertices)} vertices, {len(self.faces)} faces")
    
    def export_obj(self, filename="island.obj"):
        """Export mesh to OBJ file format"""
        print(f"Exporting to {filename}...")
        
        with open(filename, 'w') as f:
            # Write header
            f.write("# 3D Island Generator Output\n")
            f.write(f"# Vertices: {len(self.vertices)}\n")
            f.write(f"# Faces: {len(self.faces)}\n\n")
            
            # Write vertices
            for i, (x, y, z) in enumerate(self.vertices):
                r, g, b = self.colors[i]
                f.write(f"v {x:.6f} {y:.6f} {z:.6f} {r:.6f} {g:.6f} {b:.6f}\n")
            
            f.write("\n")
            
            # Write faces (OBJ uses 1-based indexing)
            for v1, v2, v3 in self.faces:
                f.write(f"f {v1+1} {v2+1} {v3+1}\n")
        
        print(f"Export complete: {filename}")
    
    def generate(self, seed=0, output_file="island.obj"):
        """
        Generate complete island terrain and export to file
        
        Args:
            seed: Random seed for reproducible generation
            output_file: Output OBJ filename
        """
        self.generate_terrain(seed)
        self.create_mesh()
        self.export_obj(output_file)
        print(f"\nIsland generation complete!")
        print(f"- Resolution: {self.width}x{self.height}")
        print(f"- Sea level: {self.sea_level}")
        print(f"- Sea depth: {self.sea_depth}")
        print(f"- Output: {output_file}")


def main():
    """Main entry point for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate 3D procedural islands with unified sea mass"
    )
    parser.add_argument(
        "--width", type=int, default=200,
        help="Width of terrain grid (default: 200)"
    )
    parser.add_argument(
        "--height", type=int, default=200,
        help="Height of terrain grid (default: 200)"
    )
    parser.add_argument(
        "--sea-level", type=float, default=0.3,
        help="Sea level threshold 0.0-1.0 (default: 0.3)"
    )
    parser.add_argument(
        "--sea-depth", type=float, default=0.2,
        help="Depth of sea layer (default: 0.2)"
    )
    parser.add_argument(
        "--scale", type=float, default=50.0,
        help="Noise scale (default: 50.0)"
    )
    parser.add_argument(
        "--seed", type=int, default=0,
        help="Random seed (default: 0)"
    )
    parser.add_argument(
        "--output", type=str, default="island.obj",
        help="Output filename (default: island.obj)"
    )
    
    args = parser.parse_args()
    
    generator = IslandGenerator(
        width=args.width,
        height=args.height,
        sea_level=args.sea_level,
        sea_depth=args.sea_depth,
        scale=args.scale
    )
    
    generator.generate(seed=args.seed, output_file=args.output)


if __name__ == "__main__":
    main()
