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
from Scripts.clean_functions import calculate_dac_score
from Scripts.profile_functions import get_variable_impact

current_dir = Path(__file__).parent
ces_df = pd.read_csv(f"{current_dir}/cleaned_data/cleaned_ces_cdc.csv")
old_score = pd.read_csv(f"{current_dir}/cleaned_data/default_score.csv")
working_score_df = 'None'
#dropdown_options = pd.read_csv(f"{current_dir}/cleaned_data/dropdown_labels.csv")
counties = pd.DataFrame({'County': list(set(old_score['County'].values))}).to_dict(orient='records')
raw_geo_df = pd.read_csv(f'{current_dir}/cleaned_data/geojson_data.csv')
raw_geo_df['geometry'] = raw_geo_df['geometry'].apply(wkt.loads)
geo_df = gpd.GeoDataFrame(raw_geo_df, geometry='geometry')
working_geo_df = 'None'
race_data = pd.read_csv(f"{current_dir}/cleaned_data/acs_race_poverty_estimates.csv")

old_score['score_comp'] = get_variable_impact(old_score)

bp = Blueprint('main', __name__)

@bp.route('/county_dropdown', methods=['GET'])
@cross_origin()
def send_dropdown_counties():
    return jsonify(counties)

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

    return jsonify({'piechart': pie_data, 'radialchart': radial_data})

@bp.route('/profile/overall_graphs', methods=['GET'])
@cross_origin()
def get_overall_graphs():
    if not isinstance(working_score_df, str):
        score_df = working_score_df
    else: 
        score_df = old_score
    
    #Percent of tracts which are disadvantaged by county
    counties = set(score_df['County'].values)
    perc_disadvantaged = []
    sorted_disadvantaged = []
    for county in counties:
        temp_dict = {}
        tracts = score_df.loc[score_df['County'] == county]
        disad_prop = tracts.loc[tracts['DAC'] == 1].shape[0] / tracts.shape[0]
        temp_dict['name'] = county
        temp_dict['value'] = round(disad_prop*100, 2)
        perc_disadvantaged.append(temp_dict)

    
    #Racial breakdown of disadvantaged vs. non-disadvantaged tracts
    perc_cols = [x for x in race_data.columns if x[0] == 'p' and x.find('_') == -1]
    perc_cols += ['Census Tract', 'Total']
    race_df = race_data[perc_cols]
    new_names = {'pWhiteNH': 'White',
    'pLatine': 'Latino',
    'pBlack': 'Black',
    'pAsian': 'Asian',
    'pAIAN': 'Native American',
    'pMixed': 'Mixed',
    'pOther': 'Other',
    'pNHPI': 'Pacific Islander'}

    race_df.rename(columns=new_names, inplace=True)
    for col in new_names.values():
        race_df[col] = race_df[col] * race_df['Total']
    race_df = score_df.merge(race_df, how='left', on='Census Tract')
    race_df.dropna(subset=['Total'], inplace=True)
    yes_dac = race_df.loc[race_df['DAC'] == 1]
    total_yes = np.sum(yes_dac['Total'].values)
    no_dac = race_df.loc[race_df['DAC'] == 0]
    total_no = np.sum(no_dac['Total'].values)
    yes_dac_data = []
    no_dac_data = []

    for column in new_names.values():
        temp_dict_no_dac = {}
        temp_dict_dac = {}
        prop_yes = sum(yes_dac[column].values) / total_yes
        prop_no = sum(no_dac[column].values) / total_no
        temp_dict_dac['name'] = column
        temp_dict_dac['value'] = prop_yes
        temp_dict_no_dac['name'] = column
        temp_dict_no_dac['value'] = prop_no
        yes_dac_data.append(temp_dict_dac)
        no_dac_data.append(temp_dict_no_dac)
    
    return jsonify({'disadvantagedBar': perc_disadvantaged, 
                    'racialDisadvantaged': yes_dac_data, 
                    'racialNonDisadvantaged': no_dac_data})



@bp.route('/profile/dynamic_rationale', methods=['POST'])
@cross_origin()
def dynamic_rationale():
    if not isinstance(working_score_df, str):
        score_df = working_score_df
    else: 
        score_df = old_score
    print('Dynamic Rationale Data:', request.json)
    tract = request.json['data']['tract']
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

    return jsonify({'piechart': pie_data, 'radialchart': radial_data})
    


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
                                    pop_vars, ses_vars, suffix=' Pctl', 
                                    avg=None, env_exp_weight=float(weights['exp_weight']), 
                                    env_eff_weight=float(weights['eff_weight']),
                                   ses_weight=float(weights['ses_weight']), pop_weight=float(weights['pop_weight']))
    working_score_df['score_comp'] = get_variable_impact(working_score_df, env_exp_weight=float(weights['exp_weight']), 
                                    env_eff_weight=float(weights['eff_weight']),
                                   ses_weight=float(weights['ses_weight']), pop_weight=float(weights['pop_weight']))

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
    working_score_df['score_comp'] = get_variable_impact(working_score_df, env_exp_weight=float(data['exp']), env_eff_weight=float(data['exp']),
                                   ses_weight=float(data['ses']), pop_weight=float(data['pop']))
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

@bp.route('/optimize', methods=['POST'])
@cross_origin()
def start_optimize():
    data = request.json

    print('Optimization Data', data)
    
    return jsonify('')


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
        popup=folium.GeoJsonPopup(
            fields=['id', 'County', 'DAC'],  
            aliases=['Tract: ', 'County: ' ,'Disadvantaged: '],  
            localize=True  
        )
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
        popup=folium.GeoJsonPopup(
            fields=['id', 'County', 'DAC'],  
            aliases=['Tract: ', 'County: ' ,'Disadvantaged: '],  
            localize=True  
        )
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
