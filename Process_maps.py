import pandas as pd
import numpy as np
import folium
import json
from pathlib import Path
from ipyleaflet import Map, Choropleth, GeoJSON, WidgetControl


current_dir = Path.cwd()

#Loading data
geojson_path = f'{current_dir}/data/tract_boundaries.json'
with open(geojson_path) as f:
    geojson_data = json.load(f)

dac_data = pd.read_csv(f"{current_dir}/cleaned_data/default_score.csv")

#Removing unnecessary columns and adding Leading zero to census tracts (to match GEOjson file)
dac_data.drop(columns=dac_data.columns[2:-3], inplace=True)
dac_data.rename(columns={'Census Tract': "GEOID"}, inplace=True)
def leading_zero(col):
    return '0' + str(col)
dac_data['GEOID'] = dac_data['GEOID'].apply(leading_zero)

#Adding "id" feature to geojson file
for tract in geojson_data['features']:
    ID = tract['properties']['GEOID']
    tract['id'] = ID

#Adding tracts present in the Geojson file but not the DAC classification data as missing values
tracts = [tract['id'] for tract in geojson_data['features']]
missing_tracts = [tract for tract in tracts if tract not in dac_data['GEOID'].values]

#initializing datagrame for missing tracts
missing_df = pd.DataFrame()
missing_df['GEOID'] = missing_tracts
for col in dac_data.columns[1:]:
    missing_df[col] = np.repeat(None, len(missing_tracts))

#Appending missing tracts to DAC dataframe
dac_data_complete = pd.concat([dac_data, missing_df], ignore_index=True)

#Classifying missing tracts as "missing"
def categorize(col):
    if col == 1:
        return 'Yes'
    elif col == 0:
        return 'No'
    else: 
        return "Missing"
dac_data_complete['DAC'] = dac_data_complete['DAC'].apply(categorize)

#Adding a DAC and an id element to the geojson file and removing unnecessary properties
for tract in geojson_data['features']:
    ID = tract['properties']['GEOID']
    tract['DAC'] = dac_data_complete.loc[dac_data_complete['GEOID'] == ID]['DAC'].values[0]
    tract['id'] = ID
    prop = {}
    count = 0
    for key, val in tract['properties'].items():
        if count <= 4:
            prop[key] = val
            count +=1
    tract['properties'] = prop

#Saving geojson file
fp = f'{current_dir}/cleaned_data/tract_boundaries.json'
with open(fp, 'w') as file:
    json.dump(geojson_data, file)

#Saving altered dac data file
dac_data_complete.to_csv(f"{current_dir}/cleaned_data/geo_df.csv", index=False)

#Creating base DAC map
