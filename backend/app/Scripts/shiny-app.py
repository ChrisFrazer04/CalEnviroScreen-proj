from pathlib import Path
import matplotlib.pyplot as plt
from shiny import App, ui, reactive, render
import pandas as pd
import numpy as np
from clean_functions import calculate_dac_score, get_tract_changes, get_funding_reallocation_24
from Graph_functions import funding_barplot, changes_scatterplot, changes_barplot
import folium
import nest_asyncio
from ipyleaflet import Map, GeoJSON
from ipywidgets.embed import embed_minimal_html

# Allow nested asyncio event loops
nest_asyncio.apply()

current_dir = Path.cwd()

data = pd.read_csv(f"{current_dir}/cleaned_data/cleaned_ces_cdc.csv")
old_score = pd.read_csv(f"{current_dir}/cleaned_data/default_score.csv")
funding_24 = pd.read_csv(f"{current_dir}/cleaned_data/cci_2024.csv") #Need to make the funding graph only show up after calculate has been clicked

default_env_exp_vars = ["Ozone","PM2.5","Diesel PM","Drinking Water","Lead","Pesticides","Tox. Release","Traffic"]
default_env_eff_vars = ['Cleanup Sites','Groundwater Threats','Haz. Waste','Imp. Water Bodies','Solid Waste']
default_ses_vars = ['Education','Linguistic Isolation','Poverty','Unemployment','Housing Burden']
defualt_pop_vars = ["Asthma", "Low Birth Weight", "Cardiovascular Disease"]
default_cdc_vars = []




styles = """
    .variable-checkbox-group, .radio-buttons {
        border-bottom: 3px solid black;
    }
        
    .input-button {
        margin: 0 auto;
        display: block;
    }


    img {
        width: 45%;
        height: auto;
        border: 2px solid black;
        display: block;
        margin: 0 auto;
    }

    .plot-header {
        margin: 0 auto
    }
"""

app_ui = ui.page_fluid(
    ui.tags.style(styles),
    ui.layout_sidebar(
        ui.panel_sidebar(
            ui.tags.div(
                ui.input_checkbox_group(
                    "env_exp_vars",
                    "Environmental Factors 1",
                    {
                        'Ozone': 'Ozone',
                        'PM2.5': 'PM 2.5',
                        'Diesel PM': 'Diesel PM',
                        "Drinking Water": "Drinking Water",
                        "Lead": "Lead",
                        "Pesticides": "Pesticides",
                        "Tox. Release": "Toxicity",
                        "Traffic": "Traffic"
                    },
                    selected=default_env_exp_vars
                ),
                class_="variable-checkbox-group"
            ),
            ui.tags.div(
                ui.input_checkbox_group(
                    "env_eff_vars",
                    "Environmental Factors 2",
                    {
                        "Cleanup Sites": "Cleanup Sites",
                        "Groundwater Threats": "Groundwater Threats",
                        "Haz. Waste": "Hazardous Waste",
                        "Imp. Water Bodies": "Imp. Water Bodies",
                        "Solid Waste": "Solid Waste",
                    },
                    selected=default_env_eff_vars
                ),
                class_="variable-checkbox-group"
            ),
            ui.tags.div(
                ui.input_checkbox_group(
                    "ses_vars",
                    "Socioeconomic Factors",
                    {
                        "Education": "Education",
                        "Linguistic Isolation": "Linguistic Isolation",
                        "Poverty": "Poverty",
                        "Unemployment": "Unemployment",
                        "Housing Burden": "Housing Burden",
                    },
                    selected=default_ses_vars
                ),
                class_="variable-checkbox-group"
            ),
            ui.tags.div(
                ui.input_checkbox_group(
                    "pop_vars",
                    "Health Factors (CES)",
                    {
                        "Asthma": "Asthma (CES)",
                        "Low Birth Weight": "Low Birth Weight",
                        "Cardiovascular Disease": "Cardiovascular Disease",
                    },
                    selected=defualt_pop_vars
                ),
                class_="variable-checkbox-group"
            ),
            ui.tags.div(
                ui.input_checkbox_group(
                    "cdc_vars",
                    "Health Factors (CDC)",
                    {
                        "CDC_Cancer": "Cancer among Adults",
                        "CDC_COPD": "Chronic Obstructive Pulmonary Diseases (COPD)",
                        "CDC_Smoking": "Smoking",
                        "CDC_Asthma": "Asthma among adults",
                        "CDC_CKD": "Chronic Kidney Disease",
                        "CDC_CVD": "Coronary Heart Disease"
                    },
                    selected=default_cdc_vars
                ),
                class_="variable-checkbox-group"
            ),
            ui.tags.div(
                ui.input_radio_buttons(
                    "agg_method",
                    "Aggregation Method",
                    {
                        " Pctl": "Percentile",
                        "": "Raw Counts",
                        " Scaled": "Standardized"
                    },
                    selected=" Pctl"
                ),
                class_="radio-buttons"
            ),
            ui.tags.div(
                ui.input_radio_buttons(
                    "calc_method",
                    "Calculation Method",
                    {
                        "": "Default",
                        "avg": "Averages",
                    },
                    selected=""
                ),
                class_="radio-buttons"
            ),
            ui.tags.div(
                ui.input_action_button("calculate", "Calculate DAC"),
                class_="input-button"
            ),
            ui.tags.div(
                ui.input_action_button("reset", "Reset"),
                class_="input-button"
            ),
        ),
        ui.panel_main(
        ui.tags.div(
            ui.h2("Generated Plots"),
            class_='plot-header'
        ),
            ui.output_image('fund_bar'),
            ui.output_image('changes_bar'),
            ui.output_image('changes_scatter'),
    )
    ),
)

def server(input, output, session):
    #Map Integration
    #def working_on():
    @render.ui
    def folium_map():
        # Read the saved Folium map HTML file
        #m = folium.Map(location=[37.7749, -122.4194], zoom_start=6)
        #m.save(f'{current_dir}/Static/test_map.html')
        folium_map_path = Path(f'{current_dir}/Static/test_map.html')
        map = folium_map_path.read_text()
        print(map[:100])
        return ui.HTML(map)


    #Checkboxes and handling inputs for DAC calculations
    reactive_old_score = reactive.Value(old_score)
    reactive_plot_paths = reactive.Value()

    def perform_calculations():
        env_exp_vars = list(input.env_exp_vars())
        env_eff_vars = list(input.env_eff_vars())
        ses_vars = list(input.ses_vars())
        pop_vars = list(input.pop_vars()) + list(input.cdc_vars())
        agg_method = input.agg_method()
        calc_method = input.calc_method()
        new_score = calculate_dac_score(data, env_exp_vars, env_eff_vars,
                                    pop_vars, ses_vars, suffix=agg_method, 
                                    avg=calc_method)
        changes = get_tract_changes(reactive_old_score.get(), new_score)
        funding_plot = funding_barplot(funding_24, changes[2])
        changes_bar = changes_barplot(reactive_old_score.get(), new_score)
        changes_scatter = changes_scatterplot(reactive_old_score.get(), new_score)
        print(f'Your Changes caused the redesignation of {changes[4]} tracts from the following counties: {changes[5]}')
        #reactive_old_score.set(new_score)
        print(new_score.head())
        return (funding_plot, changes_bar, changes_scatter)


    @reactive.effect
    @reactive.event(input.calculate)
    def render_slected():
        plots = perform_calculations()
        reactive_plot_paths.set(plots)



    #Reset Button
    @reactive.effect
    @reactive.event(input.reset)
    def reset_values():
        ui.update_checkbox_group("env_exp_vars", selected=default_env_exp_vars)
        ui.update_checkbox_group("env_eff_vars", selected=default_env_eff_vars)
        ui.update_checkbox_group("ses_vars", selected=default_ses_vars)
        ui.update_checkbox_group("pop_vars", selected=defualt_pop_vars)
        ui.update_checkbox_group('cdc_vars', selected=[])
        ui.update_radio_buttons("agg_method", selected=" Pctl")
        ui.update_radio_buttons("calc_method", selected="")
        #reactive_old_score.set(old_score)

    @output
    @render.image
    def fund_bar():
        fund_bar_path = reactive_plot_paths.get()[0]
        return {"src": fund_bar_path, "alt": "Changes Bar Plot"}
    
    @output
    @render.image
    def changes_bar():
        changes_bar_path = reactive_plot_paths.get()[1]
        return {"src": changes_bar_path, "alt": "Changes Bar Plot"}
    
    @output
    @render.image
    def changes_scatter():
        changes_scatter_path = reactive_plot_paths.get()[2]
        return {"src": changes_scatter_path, "alt": "Changes Bar Plot"}

app = App(app_ui, server)

if __name__ == "__main__":
    app.run(port=8045)





