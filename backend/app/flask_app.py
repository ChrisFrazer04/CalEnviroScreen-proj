from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
from pathlib import Path
from matplotlib.lines import Line2D
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import math
from Scripts.clean_functions import calculate_dac_score, get_tract_changes, get_funding_reallocation_24
#from Scripts.Graph_functions import funding_barplot, changes_scatterplot, changes_barplot
app = Flask(__name__)
CORS(app)
plt.ioff()
plt.style.use('seaborn-v0_8-dark')

current_dir = Path(__file__).parent
ces_df = pd.read_csv(f"{current_dir}/cleaned_data/cleaned_ces_cdc.csv")
old_score = pd.read_csv(f"{current_dir}/cleaned_data/default_score.csv")

def changes_barplot(old_DAC, new_DAC):
    data_df = pd.DataFrame()
    data_df['Old_Perc'] = old_DAC['Percentile']
    #data_df['Old_DAC'] = old_DAC['DAC']
    data_df['New_Perc'] = new_DAC['Percentile']

    def gained_percentile(row):
        if row.iloc[0] < 75 and row.iloc[1] >= 75:
            return math.floor(row.iloc[0] /10)
        else: 
            return -1
        
    def lost_percentile(row):
        if row.iloc[0] >= 75 and row.iloc[1] < 75:
            return math.floor(row.iloc[0] /10)
        else: 
            return -1

    data_df['Gained'] = data_df.apply(gained_percentile, axis=1)
    data_df['Lost'] = data_df.apply(lost_percentile, axis=1)
    percentiles = np.arange(0,10)
    gained_num = np.zeros(10)
    lost_num = np.zeros(10)
    num_gained = data_df.groupby('Gained').count()
    num_lost = data_df.groupby('Lost').count()
    #print(set(changes))
    #changes = [x for x in changes if x != -1]
    #changes
    for x, y in zip(num_gained.index, num_gained.iloc[:,1]):
        if x in percentiles:
            gained_num[x] += y

    for x, y in zip(num_lost.index, num_lost.iloc[:,1]):
        if x in percentiles:
            lost_num[x] += y

    fig, ax = plt.subplots()

    gain_bars = ax.bar(percentiles, gained_num, color='green', label='Gained DAC Designation')
    loss_bars = ax.bar(percentiles, lost_num, bottom=gained_num, color='red', label='Lost DAC Designation')
    precenetile_labels = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%']

    ax.set_xlabel('Original Percentile Group')
    ax.set_xticks(percentiles)
    ax.set_xticklabels(precenetile_labels, rotation=-60)
    ax.set_ylabel('Number of Reclassifications')
    ax.set_title('DAC Designation Changes by Percentile')
    ax.legend()
    plt.tight_layout()
    plot_path = f"{current_dir}/static/img/changes_barplot.png"
    plt.savefig(plot_path)
    plt.close()
    # "changes_barplot.png"
    return "changes_barplot.png"

def changes_scatterplot(old_DAC, new_DAC):
    data_df = pd.DataFrame()
    data_df['Old_Perc'] = old_DAC['Percentile']
    #data_df['Old_DAC'] = old_DAC['DAC']
    data_df['New_Perc'] = new_DAC['Percentile']

    def get_colors(row):
        if row.iloc[0] >= 75 and row.iloc[1] < 75:
            return 'r'
        if row.iloc[0] < 75 and row.iloc[1] >= 75:
            return 'g'
        else: 
            return 'black'
        
    colors = data_df.apply(get_colors, axis=1)

    plt.scatter(data_df['Old_Perc'].values, data_df['New_Perc'].values, color=colors, s=0.3)
    plt.plot([0,100], [75,75], ls='--')

    legend_entries = [
        Line2D([0], [0], marker='o', color='w', label='Lost DAC designation', markerfacecolor='r', markersize=6),
        Line2D([0], [0], marker='o', color='w', label='Gained DAC Designation', markerfacecolor='g', markersize=6),
        Line2D([0], [0], marker='o', color='w', label='No Change', markerfacecolor='black', markersize=6),
        Line2D([0], [0], color='blue', lw=2, linestyle='--', label='Designation Line (75th perc.)')
    ]

    plt.legend(handles=legend_entries, loc='lower right')

    plt.xlabel('Original Percentile')
    plt.ylabel('New Percentile')
    plt.title('DAC Score Changes')
    plt.tight_layout()
    plot_path = f"{current_dir}/static/img/changes_scatterplot.png"
    plt.savefig(plot_path)
    plt.close()

    return "changes_scatterplot.png"

@app.route('/api/data', methods=['POST'])
def handle_data():
    data = request.json  # Get the JSON data sent from the frontend
    print("Data received from frontend:", data)
    env_exp_vars = data['env_exp_vars']
    env_eff_vars = data['env_eff_vars']
    ses_vars = data['ses_vars']
    pop_vars = data['pop_vars']
    suffix = data['suffix']
    calc_method = data['calc_method']

    new_score = calculate_dac_score(ces_df, env_exp_vars, env_eff_vars,
                                    pop_vars, ses_vars, suffix=suffix, 
                                    avg=calc_method)
    changes = get_tract_changes(old_score, new_score)
    changes_bar = changes_barplot(old_score, new_score)
    changes_scatter = changes_scatterplot(old_score, new_score)
    print(f'Your Changes caused the redesignation of {changes[4]} tracts from the following counties: {changes[5]}')
    print(new_score.head())

    # Process the data as needed
    print(type(data), changes_bar)
    response = {
        "barplot": url_for('static', filename=f'img/{changes_bar}'),
        'scatterplot': url_for('static', filename=f'img/{changes_scatter}')
    }
    
    return jsonify(response)


if __name__ == '__main__':
    app.run(debug=True)