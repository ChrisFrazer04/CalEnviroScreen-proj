from flask import Blueprint, request, jsonify, url_for, send_file
from flask_cors import cross_origin
from pathlib import Path
from matplotlib.lines import Line2D
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import math
import folium
from folium import Element, MacroElement
from jinja2 import Template
import geopandas as gpd
from shapely import wkt
from Scripts.clean_functions import calculate_dac_score, get_tract_changes, get_funding_reallocation_24
from Scripts.Graph_functions import changes_barplot, changes_scatterplot
from Scripts.profile_functions import generate_messages, get_variable_impact

current_dir = Path(__file__).parent
ces_df = pd.read_csv(f"{current_dir}/cleaned_data/cleaned_ces_cdc.csv")
old_score = pd.read_csv(f"{current_dir}/cleaned_data/default_score.csv")
working_score_df = 'None'
dropdown_options = pd.read_csv(f"{current_dir}/cleaned_data/dropdown_labels.csv")
counties = pd.DataFrame({'County': list(set(dropdown_options['County'].values))}).to_dict(orient='records')
models = pd.read_csv(f"{current_dir}/cleaned_data/models.csv")
raw_geo_df = pd.read_csv(f'{current_dir}/cleaned_data/geojson_data.csv')
raw_geo_df['geometry'] = raw_geo_df['geometry'].apply(wkt.loads)
geo_df = gpd.GeoDataFrame(raw_geo_df, geometry='geometry')
working_geo_df = 'None'

old_score['score_comp'] = get_variable_impact(old_score)

bp = Blueprint('main', __name__)

@bp.route('/county_dropdown', methods=['GET'])
@cross_origin()
def send_dropdown_counties():
    return jsonify(counties)

@bp.route('/tract_dropdown', methods=['POST', 'GET'])
@cross_origin()
def send_dropdown_tracts():
    selection = request.json['county']
    print(selection)
    subset = dropdown_options.loc[dropdown_options['County'] == selection]
    options = subset.to_dict(orient='records')
    return jsonify(options)

@bp.route('/profile/default_rationale', methods=['POST'])
@cross_origin()
def get_profile():
    if not isinstance(working_score_df, str):
        score_df = working_score_df
    else: 
        score_df = old_score
    
    print('Default Rationale Triggered')
    print(request.json)
    tract = request.json['tract']
    messages = generate_messages(models, tract, method='')
    max_msg = messages[0]
    min_msg = messages[1]
    values = round(messages[2]['default'], 2)
    #print(messages)
    row = score_df.loc[score_df['Census Tract'] == tract]
    var_comp = row['score_comp'].values[0]
    pie_data = [
        {'name': 'Environmental Effect', 'value': var_comp[1]},
        {'name': 'Environmental Exposure', 'value': var_comp[0]},
        {'name': 'Socioeconomic', 'value': var_comp[2]},
        {'name': 'Health', 'value': var_comp[3]}
    ]

    def get_score_color(score):
        if score < 100:
            return '#'
        elif score < 75:
            return '#'

    radial_data = [
        {'name': 'Environmental Exposure', 'value': round(row['env_exposure'].values[0], 2), 'fill': '#358CCF'},
        {'name': 'Environmental Effect', 'value': round(row['env_effect'].values[0], 2), 'fill': '#3FCF35'},
        {'name': 'Socioeconomic', 'value': round(row['ses_factors'].values[0], 2), 'fill': '#C535CF'},
        {'name': 'Health', 'value': round(row['sens_pop'].values[0], 2), 'fill': '#CF7835'},
        {'name': 'Overall', 'value': round(row['Percentile'].values[0], 2), 'fill': '#CF3582'}
    ]

    return jsonify({'maxmsg': max_msg, 'minmsg': min_msg, 'range': values, 'piechart': pie_data, 'radialchart': radial_data})


@bp.route('/profile/dynamic_rationale', methods=['POST'])
@cross_origin()
def dynamic_rationale():
    if not isinstance(working_score_df, str):
        score_df = working_score_df
    else: 
        score_df = old_score
    print('Dynamic Rationale Data:', request.json)
    tract = request.json['data']['tract']
    messages = generate_messages(models, tract, method='')
    max_msg = messages[0]
    min_msg = messages[1]
    values = round(messages[2]['default'], 2)
    #print(messages)
    row = score_df.loc[score_df['Census Tract'] == tract]
    var_comp = row['score_comp'].values[0]
    pie_data = [
        {'name': 'Environmental Effect', 'value': var_comp[1]},
        {'name': 'Environmental Exposure', 'value': var_comp[0]},
        {'name': 'Socioeconomic', 'value': var_comp[2]},
        {'name': 'Health', 'value': var_comp[3]}
    ]

    def get_score_color(score):
        if score < 100:
            return '#'
        elif score < 75:
            return '#'

    radial_data = [
        {'name': 'Environmental Exposure', 'value': round(row['env_exposure'].values[0], 2), 'fill': '#358CCF'},
        {'name': 'Environmental Effect', 'value': round(row['env_effect'].values[0], 2), 'fill': '#3FCF35'},
        {'name': 'Socioeconomic', 'value': round(row['ses_factors'].values[0], 2), 'fill': '#C535CF'},
        {'name': 'Health', 'value': round(row['sens_pop'].values[0], 2), 'fill': '#CF7835'},
        {'name': 'Overall', 'value': round(row['Percentile'].values[0], 2), 'fill': '#CF3582'}
    ]

    return jsonify({'maxmsg': max_msg, 'minmsg': min_msg, 'range': values, 'piechart': pie_data, 'radialchart': radial_data})
    


@bp.route('/api/data', methods=['POST'])
@cross_origin()
def handle_data():
    data = request.json  # Get the JSON data sent from the frontend
    print("Data received from frontend (/api/data):", data)
    env_exp_vars = data['env_exp_vars']
    env_eff_vars = data['env_eff_vars']
    ses_vars = data['ses_vars']
    pop_vars = data['pop_vars']
    suffix = data['suffix']
    calc_method = data['calc_method']
    weights = data['weights']
    global working_score_df
    working_score_df = calculate_dac_score(ces_df, env_exp_vars, env_eff_vars,
                                    pop_vars, ses_vars, suffix=suffix, 
                                    avg=calc_method, env_exp_weight=float(weights['exp_weight']), 
                                    env_eff_weight=float(weights['eff_weight']),
                                   ses_weight=float(weights['ses_weight']), pop_weight=float(weights['pop_weight']))
    working_score_df['score_comp'] = get_variable_impact(working_score_df)

    def categorize(col):
        if col == 1:
            return 'Yes'
        elif col == 0:
            return 'No'
        else: 
            return "Missing"
    temp_df = working_score_df[['Census Tract', 'DAC']].copy()
    temp_df['DAC'] = temp_df['DAC'].apply(categorize)
    global working_geo_df
    working_geo_df = geo_df.merge(temp_df, how='left', left_on='id', right_on='Census Tract'
                        ).drop(columns=['DAC_x', 'Census Tract']).rename(columns={'DAC_y': 'DAC'}
                                                                        ).fillna('Missing')
    
    print(working_score_df.head(5))
    ## OLD CODE - MAKES BARGRAPHS (new_score = working_score_df)
    #changes = get_tract_changes(old_score, new_score)
    #changes_bar = changes_barplot(old_score, new_score)
    #changes_scatter = changes_scatterplot(old_score, new_score)
    #print(f'Your Changes caused the redesignation of {changes[4]} tracts from the following counties: {changes[5]}')
    #print(new_score.head())

    # Process the data as needed
    #print(type(data), changes_bar)
    #response = {
    #    "barplot": url_for('static', filename=f'img/{changes_bar}'),
    #    'scatterplot': url_for('static', filename=f'img/{changes_scatter}')
    #}
    return jsonify({'task': 'Output New Map'})

@bp.route('/slider', methods=['POST'])
@cross_origin()
def slider_change():
    data = request.json  # Get the JSON data sent from the frontend
    print("Data received from frontend (/slider):", data)
    env_exp_vars = data['env_exp_vars']
    env_eff_vars = data['env_eff_vars']
    ses_vars = data['ses_vars']
    pop_vars = data['pop_vars']
    suffix = data['suffix']
    calc_method = data['calc_method']
    global working_score_df
    working_score_df = calculate_dac_score(ces_df, env_exp_vars, env_eff_vars,
                                    pop_vars, ses_vars, suffix=suffix, 
                                    avg=calc_method, env_exp_weight=float(data['exp']), env_eff_weight=float(data['exp']),
                                   ses_weight=float(data['ses']), pop_weight=float(data['pop']))
    working_score_df['score_comp'] = get_variable_impact(working_score_df)
    tract = int(data['tract'])
    percentile = round(working_score_df.loc[working_score_df['Census Tract'] == tract]['Percentile'].values[0], 2)
    print(percentile)
    response = f"Slider Values: {data}"

    return jsonify({'Percentile': percentile})
 
colors = {
    'Yes': ['#0AB12E', 0.9],
    'No': ['#EC2E42', 0.9],
    'Missing': ['#C0C0C0', 0.65]
}

# Function to style the GeoJSON layer
def style_function(feature):
    category = feature['properties']['DAC']
    return {
        'fillColor': colors[category][0],  # Fill color (hex color code)
        'color': 'black',        # Border color
        'weight': 0.1,           # Border width
        'fillOpacity': colors[category][1]         # Fill opacity
    }

def highlight_function(feature):
    category = feature['properties']['DAC']
    return {
        'fillColor': colors[category][0],  # Fill color (hex color code)
        'color': 'black',        # Border color
        'weight': 0.1,           # Border width
        'fillOpacity': (colors[category][1] / 2 )       # Fill opacity
    }

click_js = """
        click: function(e) {
            var data = e.target.feature.properties
            var tract = data.id
            console.log(tract)
            window.parent.postMessage(JSON.stringify({ tract: tract }), '*');
        },"""

@bp.route('/api/landing_map', methods=['GET'])
@cross_origin()
def get_map1():
    if not isinstance(working_geo_df, str):
        df = working_geo_df
        print('Non-default Settings Detected (landing map)')
    else:
        df = geo_df
    m = folium.Map(location=[37.77,-122.41], zoom_start=6)

    # Create a GeoJSON layer
    geo_json_layer = folium.GeoJson(
        df.to_json(),
        style_function=style_function,
        highlight_function=highlight_function,
        name='DAC Classification',
        popup=folium.GeoJsonPopup(['id'])
    ).add_to(m)

    folium.LayerControl().add_to(m)

    map_html = m._repr_html_()

    ind = map_html.find('mouseout: ') - 200

    end_found = False
    place = map_html[ind:].find('function geo_json') + ind
    current = place
    target_func = map_html[place:]

    count = 0
    while not end_found:
        open_bracket = target_func.find('{')
        closed = target_func.find('}')
        if open_bracket < closed:
            count += 1
            current += open_bracket + 1
        else: 
            current += closed + 1
            count -= 1
        target_func = target_func[min(open_bracket, closed)+1:]
        if count == 0:
            end_found = True
    target_func = map_html[place:current]
    layer_start = target_func.find('({') + 2
    map_html2 = map_html[:place + layer_start] + click_js + map_html[place + layer_start:]
    return jsonify({'map': map_html2})


@bp.route('/api/gen_map', methods=['POST'])
@cross_origin()
def generate_map():
    if  not isinstance(working_geo_df, str):
        df = working_geo_df
    else:
        df = geo_df
    data = request.json
    county = data['county']
    county = county.strip()
    geo_df2 = df.loc[df['County'] == county]
    long, lat = list(geo_df2['geometry'].values[0].exterior.coords)[0]

    # Create a map
    m = folium.Map(location=[lat, long], zoom_start=8)
    #m = folium.Map(location=[37.77,-122.41], zoom_start=6)

    # Create a GeoJSON layer
    geo_json_layer = folium.GeoJson(
        geo_df2.to_json(),
        style_function=style_function,
        highlight_function=highlight_function,
        name='DAC Classification',
        popup=folium.GeoJsonPopup(['id'])
    ).add_to(m)

    folium.LayerControl().add_to(m)

    map_html = m._repr_html_()

    ind = map_html.find('mouseout: ') - 200

    end_found = False
    place = map_html[ind:].find('function geo_json') + ind
    current = place
    target_func = map_html[place:]

    count = 0
    while not end_found:
        open_bracket = target_func.find('{')
        closed = target_func.find('}')
        if open_bracket < closed:
            count += 1
            current += open_bracket + 1
        else: 
            current += closed + 1
            count -= 1
        target_func = target_func[min(open_bracket, closed)+1:]
        if count == 0:
            end_found = True
    target_func = map_html[place:current]
    layer_start = target_func.find('({') + 2
    map_html2 = map_html[:place + layer_start] + click_js + map_html[place + layer_start:]

    return jsonify({'map': map_html2})

@bp.route('/click', methods=['POST'])
@cross_origin()
def handle_click():
    data = request.json
    tract_id = data['id']
    print(f'Tract ID clicked: {tract_id}')
    return jsonify({'status': 'success', 'id': tract_id})
