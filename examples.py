#!/usr/bin/env python3
"""
Example script demonstrating how to use the IslandGenerator class
"""

from island_generator import IslandGenerator


def example_basic():
    """Generate a basic island with default settings"""
    print("=== Example 1: Basic Island ===")
    generator = IslandGenerator()
    generator.generate(seed=0, output_file="examples/basic_island.obj")
    print()


def example_high_resolution():
    """Generate a high-resolution island"""
    print("=== Example 2: High Resolution Island ===")
    generator = IslandGenerator(width=400, height=400)
    generator.generate(seed=123, output_file="examples/high_res_island.obj")
    print()


def example_archipelago():
    """Generate multiple islands (archipelago) by adjusting sea level"""
    print("=== Example 3: Archipelago (Multiple Islands) ===")
    generator = IslandGenerator(
        width=250,
        height=250,
        sea_level=0.4,  # Higher sea level creates more islands
        scale=40.0       # Different scale for variation
    )
    generator.generate(seed=999, output_file="examples/archipelago.obj")
    print()


def example_custom_terrain():
    """Generate with custom terrain parameters"""
    print("=== Example 4: Custom Terrain ===")
    generator = IslandGenerator(
        width=300,
        height=300,
        sea_level=0.25,     # Lower sea level = more land
        sea_depth=0.3,      # Deeper sea
        scale=70.0,         # Larger scale = smoother terrain
        octaves=8,          # More detail
        persistence=0.6,
        lacunarity=2.5
    )
    generator.generate(seed=2024, output_file="examples/custom_island.obj")
    print()


def main():
    """Run all examples"""
    import os
    
    # Create examples directory if it doesn't exist
    os.makedirs("examples", exist_ok=True)
    
    print("Island Generator Examples\n")
    print("These examples demonstrate different ways to use the generator.")
    print("Output files will be saved in the 'examples/' directory.\n")
    
    example_basic()
    example_high_resolution()
    example_archipelago()
    example_custom_terrain()
    
    print("All examples complete!")
    print("\nGenerated files:")
    print("- examples/basic_island.obj")
    print("- examples/high_res_island.obj")
    print("- examples/archipelago.obj")
    print("- examples/custom_island.obj")
    print("\nYou can open these .obj files in Blender, MeshLab, or any 3D viewer.")


if __name__ == "__main__":
    main()