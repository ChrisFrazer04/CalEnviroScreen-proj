from pathlib import Path
import pandas as pd
import numpy as np
import clean_functions as cf
from sklearn.metrics import r2_score
from sklearn.preprocessing import scale, MinMaxScaler
from scipy.stats import pearsonr

current_dir = Path.cwd()

##Loading Data
#CalEnviroScreen Result Data
Cal30 = pd.read_csv(f"{current_dir}/data/calenviroscreen-3.0-results-june-2018-update.csv")
Cal40 = pd.read_csv(f"{current_dir}/data/calenviroscreen40resultsdatadictionary_F_2021.csv")

#CCI Data
climatefund = pd.read_csv(f"{current_dir}/data/cci_2022myu_detaileddata.csv", dtype=str)

#Census Tract Designations
tract_designations = pd.read_csv(f"{current_dir}/data/ab1550censustracts_ces3_2021 - All Census Tracts.csv")

#CDC PLACES Data
cdc_df = pd.read_csv(f"{current_dir}/data/PLACES__Local_Data_for_Better_Health__Census_Tract_Data_2020_release.csv")


#CalEnviroScreen variable names
env_exp_vars = ["Ozone","PM2.5","Diesel PM","Drinking Water","Lead","Pesticides","Tox. Release","Traffic"]
env_eff_vars = ['Cleanup Sites','Groundwater Threats','Haz. Waste','Imp. Water Bodies','Solid Waste']
ses_vars = ['Education','Linguistic Isolation','Poverty','Unemployment','Housing Burden']
#Sensitive population variables
pop_vars = ["Asthma", "Low Birth Weight", "Cardiovascular Disease"]

all_vars = env_exp_vars + env_eff_vars + pop_vars + ses_vars
print(all_vars)

#DAC Calculations
numTracts = 7932

#Climate Investment Fund Categories
community_dev_vars = ["Urban Greening Program",
                      "Low Carbon Economy Workforce",
                      "Training and Workforce Development Program",
                      "Urban and Community Forestry Program",
                      "Affordable Housing and Sustainable Communities",
                      "Low-Income Weatherization Program",
                      "Transformative Climate Communities"]
air_pollution_vars = ["Community Air Grants",
                      "Commnunity Air Grants",
                      "Community Air Protection Funds",
                      "Woodsmoke Reduction Program",
                      "Low Carbon Transportation"]
transportation_vars = ["Technical Assistance",
                        "Transit and Intercity Rail Capital Program",
                        "Low Carbon Transit Operations Program"]
agriculture_vars = ["Renewable Energy for Agriculture Program",
                     "Funding Agricultural Replacement Measures for Emission Reductions",
                     "Food Production Investment Program",
                     "Low Carbon Fuels Production",
                     "Climate Smart Agriculture"]
adaptation_infrastructure_vars = ["Coastal Resilience Planning",
                                  "Climate Ready Program",
                                  "Forest Carbon Plan Implementation",
                                  "Climate Adaptation and Resiliency Program",
                                  "Fire Prevention Program",
                                  "Wetlands and Watershed Program",
                                  "Forest Health Program"]
utilities_vars = ["Safe and Affordable Funding for Equity and Resilience (Drinking Water)",
                   "Water-Energy Efficiency",
                   "Waste Diversion Program"]

#CDC Health Outcomes
cdc_measures = {'CDC_Cancer': 'Cancer (excluding skin cancer) among adults aged >=18 years',
                'CDC_COPD': 'Chronic obstructive pulmonary disease among adults aged >=18 years',
                'CDC_Smoking': 'Current smoking among adults aged >=18 years',
                'CDC_Asthma': 'Current asthma among adults aged >=18 years',
                'CDC_CKD': 'Chronic kidney disease among adults aged >=18 years',
                'CDC_CVD': 'Coronary heart disease among adults aged >=18 years'}
cdc_df = cdc_df.loc[cdc_df['StateAbbr'] == 'CA']

#Creating scaled and percentage columns
measures_df = pd.DataFrame({"Census Tract": cdc_df.groupby('LocationName').count().index})

#Associting tracts with corresponding counties
counties = []

for tract in measures_df['Census Tract']:
    counties.append(cdc_df.loc[cdc_df['LocationName'] == tract]['CountyName'].values[0])
measures_df['County'] = counties

#Adding standardized and percentile columns of variables

for label, measure in cdc_measures.items():
    measures_df[label] = cdc_df.loc[cdc_df['Measure'] == measure]['Data_Value'].values
    measures_df[label + ' Scaled'] = scale(measures_df[label])
    measures_df[label + ' Pctl'] = measures_df[label].rank(pct=True)*100

#Merging CDC data with CES data 
ces_df = Cal40.merge(measures_df, how='left', on='Census Tract')

def calculate_r2(d1, d2):
    df = pd.DataFrame({'1': d1, '2': d2})
    df.dropna(inplace=True)
    r2 = pearsonr(df['1'], df['2'])[0]**2
    return r2

#Calculating r2
raw_r2 = [calculate_r2(ces_df['Asthma'].values, ces_df['CDC_Asthma']), 
         calculate_r2(ces_df['Cardiovascular Disease'], ces_df['CDC_CVD'])]
perc_r2 = [calculate_r2(ces_df['Asthma Pctl'], ces_df['CDC_Asthma Pctl']), 
         calculate_r2(ces_df['Cardiovascular Disease Pctl'], ces_df['CDC_CVD Pctl'])]
health_correlation = pd.DataFrame({'Measure': ['Asthma', 'Cardiovascular Disease'],
                                  'raw_r2': raw_r2,
                                  'perc_r2': perc_r2})
print(health_correlation)

#Adding Standardized columns of CES variables (0 mean 1 sd)
ces_df2 = ces_df.copy()
for var in all_vars:
    ces_df2[var + ' Scaled'] = scale(ces_df[var])

#Calculating DAC scores for new tables
new_score_df = cf.calculate_dac_score(ces_df2)
scaled_score_df = cf.calculate_dac_score(ces_df2, suffix=' Scaled')
avg_score_df = cf.calculate_dac_score(ces_df2, avg='avg')

#Finding differences in DAC designated tracts between standardization methods
print('The percentage of tracts that change designation from switching to z-score standardization is', 
      cf.get_tract_changes(new_score_df, scaled_score_df)[3])
print('The percentage of tracts that change designation from switching to averaging is', 
      cf.get_tract_changes(new_score_df, avg_score_df)[3])

#Saving cleaned data file as CSV
ces_df2.to_csv(f'{current_dir}/cleaned_data/cleaned_ces_cdc.csv')

#Saving default score dataframe as CSV
new_score_df.to_csv(f'{current_dir}/cleaned_data/default_score.csv')