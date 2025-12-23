import tkinter as tk
import random
import numpy as np
import matplotlib
matplotlib.use('TkAgg')  # Explizit TkAgg-Backend setzen für Tkinter-Kompatibilität
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from mpl_toolkits.mplot3d import Axes3D

def generate_island():
    print("DEBUG: Button geklickt, generate_island() aufgerufen.")
    
    shape = random.choice(['quadrat', 'rechteck'])
    print(f"DEBUG: Ausgewählte Form: {shape}")
    
    if shape == 'quadrat':
        # Quadrat: Seitenlänge 1, mit zufälliger Höhe (Mindestens 0.1)
        vertices = np.array([
            [0, 0, max(random.uniform(0, 0.5), 0.1)],
            [1, 0, max(random.uniform(0, 0.5), 0.1)],
            [1, 1, max(random.uniform(0, 0.5), 0.1)],
            [0, 1, max(random.uniform(0, 0.5), 0.1)]
        ])
        print(f"DEBUG: Quadrat-Vertices: {vertices}")
    else:  # rechteck
        # Rechteck: 2x1, mit zufälliger Höhe (Mindestens 0.1)
        vertices = np.array([
            [0, 0, max(random.uniform(0, 0.5), 0.1)],
            [2, 0, max(random.uniform(0, 0.5), 0.1)],
            [2, 1, max(random.uniform(0, 0.5), 0.1)],
            [0, 1, max(random.uniform(0, 0.5), 0.1)]
        ])
        print(f"DEBUG: Rechteck-Vertices: {vertices}")
    
    # Faces: Zwei Dreiecke für das Viereck
    faces = np.array([
        [0, 1, 2],
        [0, 2, 3]
    ])
    print("DEBUG: Faces definiert.")
    
    # Plot aktualisieren oder neu erstellen
    global ax, canvas
    if ax is None:
        print("DEBUG: Erstes Mal Plot erstellen.")
        fig = plt.Figure(figsize=(5, 4), dpi=100)
        ax = fig.add_subplot(111, projection='3d')
        canvas = FigureCanvasTkAgg(fig, master=root)
        canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=1)
        print("DEBUG: Canvas in Tkinter gepackt.")
    else:
        print("DEBUG: Plot aktualisieren.")
    
    ax.clear()
    print("DEBUG: Achse gecleart.")
    ax.plot_trisurf(vertices[:, 0], vertices[:, 1], vertices[:, 2], triangles=faces, color='green')
    print("DEBUG: Trisurf geplottet.")
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    ax.set_title(f'Generierte Insel: {shape}')
    print("DEBUG: Labels und Titel gesetzt.")
    canvas.draw()
    print("DEBUG: Canvas gezeichnet.")

# GUI
root = tk.Tk()
root.title("Insel-Generator")
root.geometry("800x600")  # Größeres Fenster für besseren Platz

ax = None
canvas = None

button = tk.Button(root, text="Insel generieren", command=generate_island)
button.pack(pady=20)

print("DEBUG: GUI gestartet, warte auf Button-Klick.")
root.mainloop()
