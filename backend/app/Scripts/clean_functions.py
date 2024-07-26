import pandas as pd
import numpy as np
from sklearn.metrics import r2_score
from sklearn.preprocessing import scale, MinMaxScaler
from scipy.stats import pearsonr
import folium
import json
from ipyleaflet import Map, GeoJSON, WidgetControl
from ipywidgets.embed import embed_minimal_html
import ipywidgets as widgets



#CalEnviroScreen variable names
env_exp_vars = ["Ozone","PM2.5","Diesel PM","Drinking Water","Lead","Pesticides","Tox. Release","Traffic"]
env_eff_vars = ['Cleanup Sites','Groundwater Threats','Haz. Waste','Imp. Water Bodies','Solid Waste']
ses_vars = ['Education','Linguistic Isolation','Poverty','Unemployment','Housing Burden']
#Sensitive population variables
pop_vars = ["Asthma", "Low Birth Weight", "Cardiovascular Disease"]


def get_tract_changes(old_df, new_df):
    """Calculates number of tract changes, returning the percent of designations
    which changed between the input dataframes as well as which tracts changed"""

    old_tracts = set(old_df.loc[old_df['DAC'] == 1]['Census Tract'].values)
    new_tracts = set(new_df.loc[new_df['DAC'] == 1]['Census Tract'].values)
    removed_tracts = old_tracts.difference(new_tracts)
    added_tracts = new_tracts.difference(old_tracts)
    total_changes = removed_tracts | added_tracts
    percent_change = round(len(total_changes) / len(old_df) * 100, 2)
    changed_counties = list(set(old_df.loc[old_df['Census Tract'].isin(list(total_changes))]['County']))
    return (removed_tracts, added_tracts, total_changes, percent_change, len(total_changes), changed_counties)

def calculate_dac_score(data, env_exp_vars_new=env_exp_vars, env_eff_vars_new=env_eff_vars, 
                        pop_vars_new=pop_vars, ses_vars_new=ses_vars,
                        omit_var=None, pop_weights_new=None, suffix=' Pctl',avg=None, tract=None,
                        env_eff_weight=0.5, env_exp_weight=1, ses_weight=1, pop_weight=1, adversarial=False):
    """Calculates the DAC score of the input dataframe"""
    if tract:
        #Filter by tract
        data = data.loc[data['Census Tract'] == tract]
    else:
        #Remove NA values
        data = data.dropna(subset='CES 4.0 Score')
        
    #Applying suffix
    env_exp_vars_new = [x + suffix for x in env_exp_vars_new]
    env_eff_vars_new = [x + suffix for x in env_eff_vars_new]
    ses_vars_new = [x + suffix for x in ses_vars_new]

    #Removing omitted variables
    if omit_var:
        omit_var = [x + suffix for x in omit_var]
        for var in omit_var:
            if var in env_exp_vars_new:
                env_exp_vars_new.remove(var)
            if var in env_eff_vars_new:
                env_eff_vars_new.remove(var)
            if var in ses_vars_new:
                ses_vars_new.remove(var)
            else:
                pop_vars_new.remove(var)

    #Average over components
    env_exposure = data[env_exp_vars_new].apply(np.mean, axis=1)
    env_effect = data[env_eff_vars_new].apply(np.mean, axis=1)
    ses_factors = data[ses_vars_new].apply(np.mean, axis=1)

    def weighted_mean(row, weights):
        non_na = ~np.isnan(row)
        return np.average(row[non_na], weights=weights[non_na])
        
    if pop_weights_new is None:
        if isinstance(pop_vars_new[0], list):
            pop_weights_new = [np.ones(len(group)) / len(group) for group in pop_vars_new]
        else:
            pop_weights_new = np.ones(len(pop_vars_new)) / len(pop_vars_new)
    
    if not isinstance(pop_vars_new[0], list):
        sens_pop = data[[var + suffix for var in pop_vars_new]].apply(
            lambda row: weighted_mean(row, weights=pop_weights_new), axis=1)
    #This condition likely won't happen
    else:
        sens_pop_matrix = np.zeros((len(data), len(pop_vars_new)))
        for i in range(len(pop_vars_new)):
            group_avg = data[[var + suffix for var in pop_vars_new[i]]].apply(lambda row: weighted_mean(row, weights=pop_weights_new[i]), axis=1)
            sens_pop_matrix[:, i] = group_avg
        sens_pop = np.nanmean(sens_pop_matrix, axis=1)
        
    score_df = pd.DataFrame({
        'Census Tract': data['Census Tract'],
        'County': data['County'],
        'env_exposure': env_exposure,
        'env_effect': env_effect,
        'sens_pop': sens_pop,
        'ses_factors': ses_factors,
    })

    if adversarial:
        score_df['Party'] = data['Party']
        score_df['Population Density'] = data['Population Density']
        score_df['Density Rank'] = score_df['Population Density'].rank(pct=True)*100
    
    score_df['Pollution Burden'] = score_df[['env_exposure', 'env_effect']].apply(lambda row: np.average(row, weights=[env_exp_weight, 
                                                                                                                       env_eff_weight]), axis=1)
    score_df['Pop Char'] = score_df[['sens_pop', 'ses_factors']].apply(lambda row: np.average(row, weights=[ses_weight, pop_weight]), axis=1)
    
    max_pollution_burden = max(score_df['Pollution Burden'])
    max_pop_char = max(score_df['Pop Char'])
    
    #Rescaling 
    if len(score_df.loc[score_df['Pollution Burden'] < 0].values) > 0 or len(score_df.loc[score_df['Pop Char'] < 0].values) > 0:
        scaler = MinMaxScaler(feature_range=(0,10))
        score_df['Pollution Burden MinMax'] = scaler.fit_transform(score_df['Pollution Burden'].values.reshape(-1, 1))
        score_df['Pop Char MinMax'] = scaler.fit_transform(score_df['Pop Char'].values.reshape(-1, 1))
    else:
        score_df['Pollution Burden MinMax'] = 10*score_df['Pollution Burden'] / max_pollution_burden
        score_df['Pop Char MinMax'] = 10*score_df['Pop Char'] / max_pop_char
    
    if avg == 'avg':
        score_df["Score"] = score_df[['Pollution Burden MinMax', 'Pop Char MinMax']].apply(np.mean, axis=1)
    else:
        score_df['Score'] = score_df['Pollution Burden MinMax'] * score_df['Pop Char MinMax']
        
    score_df['Percentile'] = score_df['Score'].rank(pct=True)*100

    for col in score_df.columns[2:]:
        score_df[col] = score_df[col].apply(lambda x: round(x, 3))
    
    def designate(x):
        if x >= 75: #Changing this to > instead of >= makes the standardized % change equal to the paper
            return 1 
        else:
            return 0
            
    score_df['DAC'] = score_df['Percentile'].apply(designate)
    return score_df

##Mapping Functions

def make_map_choropleth(geojson_data, data):
    """Creates a folium choropleth map."""
    m = folium.Map(location=[37.77,-122.41], zoom_start=6)

    folium.Choropleth(
        geo_data=geojson_data,
        data=data,
        columns=['GEOID', 'DAC'],
        key_on='properties.GEOID',
        fill_color='GnBu',
        fill_opacity=0.5,
        line_opacity=0.5,
        legend_name='DAC_Designated'
    ).add_to(m)
    return m

def make_map(geojson_data):
    #Colors for each DAC category
    colors = {
        'Yes': ['#2EEC57', 0.7],
        'No': ['#EC2E42', 0.7],
        'Missing': ['#C0C0C0', 0.5]
    }

    # Function to style the GeoJSON layer
    def style_function(feature):
        return {
            'fillColor': colors[feature['DAC']][0],  # Fill color (hex color code)
            'color': 'black',        # Border color
            'weight': 0.1,           # Border width
            'fillOpacity': colors[feature['DAC']][1]         # Fill opacity
        }


    # Create a map
    m = Map(center=[37.77, -122.41], zoom=6, scroll_wheel_zoom=True)

    # Create a GeoJSON layer
    geo_json_layer = GeoJSON(
        data=geojson_data,
        style_callback=style_function,
        hover_style={'fillColor': 'yellow', 'fillOpacity': 0.2},
        name='DAC Classification'
    )

    # Add the GeoJSON layer to the map
    m.add_layer(geo_json_layer)

    # Add a widget control for displaying the map
    widget_control = WidgetControl(widget=widgets.Output(), position='topright')
    m.add_control(widget_control)

    return m


##Funding Functions

def get_funding_reallocation_22(funding_df, selected_tracts):
    funding_df = funding_df.loc[funding_df['Census Tract'].isin(selected_tracts)]
    return sum(funding_df['DAC3Amount'])


def get_funding_reallocation_24(funding_df, selected_tracts):
    funding_df = funding_df.loc[funding_df['Census Tract'].isin(selected_tracts)]
    return sum(funding_df['DAC1550Amount'])

def allocate_resources(money, pot):
    # Sort individuals by their total amount of money, then by their initial amount of money
    allocation_order = 2 #placeholder
    
    # Calculate amount of money to next highest value
    money_diff = money[allocation_order][1:] - money[allocation_order][:-1]
    
    # Remove excess money, starting with individuals who have the largest total amount of money
    remaining_pot = pot
    allocated_money = np.zeros(len(money))

    for i in range(len(money)):
        if i < len(money) - 1:
            # Calculate the maximum amount of money that can be allocated to the individual without violating the constraint
            max_additional_allocation = min(remaining_pot, (i+1)*money_diff[i])
        if max_additional_allocation > 0:
            allocated_money[:i+1] += max_additional_allocation / (i+1)
            remaining_pot -= max_additional_allocation
            
    return allocated_money
   # Calculate amount of money to next highest value


def process_funding_with_tracts(tracts_only, tol=10**-3):
    tracts_only = tracts_only.loc[tracts_only['Total Program GGRFFunding'] > 0]
    return