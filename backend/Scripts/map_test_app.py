from shiny import App, ui, render, reactive
import nest_asyncio
import pandas as pd
import numpy as np
import folium
import json
from pathlib import Path
from ipyleaflet import Map, GeoJSON, WidgetControl
from ipywidgets.embed import embed_minimal_html
import ipywidgets as widgets
from clean_functions import make_map
from Graph_functions import make_barplot

# Allow nested asyncio event loops
nest_asyncio.apply()

current_dir = Path.cwd()

#ipywidget map code
def working_map():
    fp = f'{current_dir}/cleaned_data/tract_boundaries.json'
    with open(fp, 'r') as file:
        geojson_data = json.load(file)


    map_obj = make_map(geojson_data)
    map_file_path = 'map.html'
    embed_minimal_html(map_file_path, views=[map_obj], title='ipyleaflet Map')

    # Step 3: Read the HTML File Content
    with open(map_file_path, 'r') as f:
        map_html_content = f.read()

    # Step 4: Define the Shiny App
    app_ui = ui.page_fluid(
        ui.h2("ipyleaflet Map in Shiny"),
        ui.div(
            ui.HTML(map_html_content),
            style="width: 100%; height: 600px; border: 1px solid black; overflow: hidden;"
        )
    )



# Create the plot and get the path
plot_path = make_barplot()

# Step 2: Read the Image File Content
plot_image_path = plot_path.as_posix()  # Convert to string path

# Step 3: Define the Shiny App
app_ui = ui.page_fluid(
    ui.h2("Matplotlib Plot in Shiny"),
    ui.div(
        ui.img(src=plot_image_path, style="width: 100%; max-width: 600px; height: auto; border: 1px solid black;")
    )
)

def server(input, output, session):
    pass

# Create the Shiny app
app = App(app_ui, server)

# Run the app
if __name__ == "__main__":
    app.run(port=8047)