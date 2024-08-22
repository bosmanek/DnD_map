# D&D Map Management Tool for Dungeon Masters

This project is a tool designed for Dungeon Masters (DMs) playing Dungeons & Dragons (D&D) with their friends. The tool provides a dynamic way to manage the map and the Fog of War, allowing the DM to reveal or hide parts of the map as the players explore. It also allows the placement and customization of tokens representing players, enemies, or other objects on the map.

## Features

- **Fog of War Management:** Easily reveal or hide areas of the map with a brush tool, giving your players an immersive experience as they explore.
- **Dynamic Map Interaction:** Zoom in and out of the map and pan across it to focus on different areas.
- **Token Management:** Add, customize, and remove tokens on the map. Tokens can represent players, enemies, or objects and are customizable in size, color, and label.
- **Map Upload:** Load custom maps via drag-and-drop or file selection.
- **Save and Load:** Save the current state of the map, including the revealed areas and placed tokens, and reload it later.

## Getting Started

### Prerequisites

- A modern web browser (Google Chrome, Firefox, etc.)
- Python 3.x with the `eel` library installed (for saving/loading map states and running the web application).

### Installation

1. Clone this repository to your local machine:

    ```bash
    git clone https://github.com/bosmanek/DnD_map
    cd DnD_map
    ```

2. Install Python dependencies:

    ```bash
    pip install os, eel, json, base64
    ```

3. Run the application:

    ```bash
    python dm_map.py
    ```

### Usage

1. Open the DM's map in one browser window and the player's view in another.
2. Use the tools provided on the HUD (Heads-Up Display) to manage the map:
   - **Fog Tool:** Reveal or hide parts of the map by clicking and dragging on the map.
   - **Token Tool:** Place tokens on the map to represent players, enemies, or other objects.
   - **Brush Size:** Adjust the size of the fog brush.
   - **Token Customization:** Change the color, image, and label of the tokens.

3. Don't need to save, autosave is enabled by default.

### Controls

- **Middle Mouse Button:** Pan the map by dragging.
- **Scroll Wheel:** Zoom in and out of the map.
- **Left Mouse Button:** Use the selected tool (reveal fog or place tokens).

### Known Issues

- Some delay may occur when loading large maps or many tokens.
- The application currently does not support mobile browsers.

## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## License

This project is open-source and available under the [MIT License](LICENSE).
