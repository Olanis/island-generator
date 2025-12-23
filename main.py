import tkinter as tk
import random
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

def generate_island():
    shape = random.choice(['quadrat', 'rechteck'])
    if shape == 'quadrat':
        # Quadrat: Seitenlänge 1
        vertices = np.array([
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0]
        ])
    else:  # rechteck
        # Rechteck: 2x1
        vertices = np.array([
            [0, 0, 0],
            [2, 0, 0],
            [2, 1, 0],
            [0, 1, 0]
        ])
    
    # Faces: Zwei Dreiecke für das Viereck
    faces = np.array([
        [0, 1, 2],
        [0, 2, 3]
    ])
    
    # Plot
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    ax.plot_trisurf(vertices[:, 0], vertices[:, 1], vertices[:, 2], triangles=faces, color='green')
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    plt.title(f'Generierte Insel: {shape}')
    plt.show()

# GUI
root = tk.Tk()
root.title("Insel-Generator")

button = tk.Button(root, text="Insel generieren", command=generate_island)
button.pack(pady=20)

root.mainloop()