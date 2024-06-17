import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from pathlib import Path
import math


current_dir = Path.cwd()

plt.style.use('seaborn-v0_8-dark')

def funding_barplot(fund_df, selected_tracts):
    fund_df = fund_df.loc[fund_df['Census Tract'].isin(selected_tracts)]
    rel_data = fund_df[['Year', 'DAC1550Amount']].groupby('Year').sum()
    year_labels = ['2019','2020','2022','2023']
    bar_colors = ['green', 'green', 'green', 'green']
    funds = rel_data.iloc[0:4]['DAC1550Amount'].values / 10**6
    plt.bar(year_labels, funds, color=bar_colors)
    plt.title('Estimated Amount of DAC Funding Reallocated (2019-2023)')
    plt.ylabel("Dollars (millions)")
    plt.xlabel('Year')
    plt.ylim = max(funds) + 0.5
    plot_path = f"{current_dir}/Static/img/funding_barplot.png"
    plt.savefig(plot_path)
    plt.close()

    return plot_path

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
    plot_path = f"{current_dir}/Static/img/changes_scatterplot.png"
    plt.savefig(plot_path)
    plt.close()

    return plot_path

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
    plot_path = f"{current_dir}/Static/img/changes_barplot.png"
    plt.savefig(plot_path)
    plt.close()

    return plot_path
    