import tkinter as tk
import random
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# Global variables for the plot
fig = None
canvas = None

def generate_island():
    global fig, canvas
    
    shape = random.choice(['quadrat', 'rechteck'])
    if shape == 'quadrat':
        # Quadrat: Seitenlänge 1 mit Höhenvariation
        vertices = np.array([
            [0, 0, random.uniform(0, 0.5)],
            [1, 0, random.uniform(0, 0.5)],
            [1, 1, random.uniform(0, 0.5)],
            [0, 1, random.uniform(0, 0.5)]
        ])
    else:  # rechteck
        # Rechteck: 2x1 mit Höhenvariation
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
    
    # Wenn bereits ein Plot existiert, entfernen
    if canvas is not None:
        canvas.get_tk_widget().destroy()
    if fig is not None:
        plt.close(fig)
    
    # Plot erstellen
    fig = plt.figure(figsize=(8, 6))
    ax = fig.add_subplot(111, projection='3d')
    ax.plot_trisurf(vertices[:, 0], vertices[:, 1], vertices[:, 2], triangles=faces, color='green')
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    ax.set_title(f'Generierte Insel: {shape}')
    
    # Plot in Tkinter einbetten
    canvas = FigureCanvasTkAgg(fig, master=plot_frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

# GUI
root = tk.Tk()
root.title("Insel-Generator")
root.geometry("800x650")

button = tk.Button(root, text="Insel generieren", command=generate_island)
button.pack(pady=10)

# Frame für den Plot
plot_frame = tk.Frame(root)
plot_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

root.mainloop()