from pathlib import Path
import pandas as pd
import numpy as np

current_dir = Path.cwd()

#CCI Funding Data
cci_22 = pd.read_csv(f"{current_dir}/data/cci_2022myu_detaileddata.csv", dtype=str)
cci_24 = pd.read_csv(f"{current_dir}/data/cci_2024ar_detaileddata.csv")

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

#Generating a clean cci_2022 csv
cci_22_cols = ["Census Tract", "Sub Program Name", 'DAC3Amount', "Project Completion Date"]
cci_22_df = cci_22[cci_22_cols]
cci_22_df.dropna(subset=['Census Tract'], inplace=True)
def get_year(col):
    return col.split('/')[2]

years = cci_22_df['Project Completion Date'].apply(get_year).values
cci_22_df['Year'] = years
cci_22_df['Census Tract'] = cci_22_df['Census Tract'].apply(int)
cci_22_df['DAC3Amount'] = cci_22_df['DAC3Amount'].apply(int)
cci_22_df.to_csv(f"{current_dir}/cleaned_data/cci_2022.csv", index=False)

#Generating a clean cci_2024 csv
cci_24_cols = ["Census Tract", "Program Name", 'DAC1550Amount', "Project Completion Date"]
cci_24_df = cci_24[cci_24_cols]
cci_24_df.dropna(subset=['Census Tract', "DAC1550Amount"], inplace=True)
def get_year(col):
    return col.split('/')[2]

years = cci_24_df['Project Completion Date'].apply(get_year).values
cci_24_df['Year'] = years
cci_24_df['Census Tract'] = cci_24_df['Census Tract'].apply(int)
cci_24_df['DAC1550Amount'] = cci_24_df['DAC1550Amount'].apply(int)
cci_24_df.to_csv(f"{current_dir}/cleaned_data/cci_2024.csv", index=False)