import tkinter as tk
import random
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from mpl_toolkits.mplot3d import Axes3D

def generate_island():
    shape = random.choice(['quadrat', 'rechteck'])
    if shape == 'quadrat':
        # Quadrat: Seitenlänge 1, mit zufälliger Höhe
        vertices = np.array([
            [0, 0, random.uniform(0, 0.5)],
            [1, 0, random.uniform(0, 0.5)],
            [1, 1, random.uniform(0, 0.5)],
            [0, 1, random.uniform(0, 0.5)]
        ])
    else:  # rechteck
        # Rechteck: 2x1, mit zufälliger Höhe
        vertices = np.array([
            [0, 0, random.uniform(0, 0.5)],
            [2, 0, random.uniform(0, 0.5)],
            [2, 1, random.uniform(0, 0.5)],
            [0, 1, random.uniform(0, 0.5)]
        ])
    
    # Faces: Zwei Dreiecke für das Viereck
    faces = np.array([
        [0, 1, 2],
        [0, 2, 3]
    ])
    
    # Plot aktualisieren oder neu erstellen
    global ax, canvas
    if ax is None:
        fig = plt.Figure(figsize=(5, 4), dpi=100)
        ax = fig.add_subplot(111, projection='3d')
        canvas = FigureCanvasTkAgg(fig, master=root)
        canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=1)
    
    ax.clear()
    ax.plot_trisurf(vertices[:, 0], vertices[:, 1], vertices[:, 2], triangles=faces, color='green')
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    ax.set_title(f'Generierte Insel: {shape}')
    canvas.draw()

# GUI
root = tk.Tk()
root.title("Insel-Generator")

ax = None
canvas = None

button = tk.Button(root, text="Insel generieren", command=generate_island)
button.pack(pady=20)

root.mainloop()
