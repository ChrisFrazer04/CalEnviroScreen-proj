import pandas as pd
import numpy as np
from pathlib import Path
import math
import json
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.Scripts.clean_functions import calculate_dac_score



current_dir = Path(__file__).parent.parent

def generate_models(data, default_score, weights=None):
    #Generating models - Takes a while to run
    weights_3 = [0.33, 0.5, 1, 2, 3]
    weights_2 = [0.5, 1, 2]
    weights_eff = [0.25, 0.5, 1]
    models = {}
    for exp in weights_2:
        for eff in weights_eff:
            for ses in weights_2:
                for pop in weights_2:
                    for method in ['default', 'avg', 'Scaled']:
                        #ensuring no repeat column for default score
                        if [exp, eff, ses, pop] == [1, 0.5, 1, 1]:
                            continue
                        model_title = f"({method}) exp_w: {exp}, eff_w: {eff}, ses_w: {ses}, pop_w: {pop}"
                        if method == 'Scaled':
                            score = calculate_dac_score(data, env_exp_weight=exp, 
                                                        env_eff_weight=eff, ses_weight=ses, pop_weight=pop, suffix=f" {method}")
                            models[model_title] = score['Percentile']
                        if method == 'avg':
                            score = calculate_dac_score(data, env_exp_weight=exp, 
                                                        env_eff_weight=eff, ses_weight=ses, pop_weight=pop, avg=method)
                            models[model_title] = score['Percentile']
                        else:
                            score = calculate_dac_score(data, env_exp_weight=exp, 
                                                        env_eff_weight=eff, ses_weight=ses, pop_weight=pop)
                            models[model_title] = score['Percentile']

    models_df = pd.DataFrame(models)
    models_df['Default_score'] = default_score['Percentile']
    models_df['Min'] = models_df.apply(lambda row: min(row), axis=1)
    models_df['Max'] = models_df.apply(lambda row: max(row[:-1]), axis=1)
    models_df['Median'] = models_df.apply(lambda row: np.median(row[:-2]), axis=1)
    models_df['Census Tract'] = score['Census Tract']
    models_df.to_csv(f'{current_dir}/cleaned_data/models.csv', index=False)
    return models_df

def generate_messages(df, tract, method='default'):
    if method == 'default':
        cols = [x for x in df.columns[:-5] if x.split()[0] == '(default)'] + list(df.columns[-5:])
        df = df[cols]
    tract = int(tract)
    row = df.loc[df['Census Tract'] == tract]
    row_nominmax = row.values[0][:-5].tolist()
    cols = df.columns[:-3]
    
    def generate_message(cols, row, func):
        extrema = func(row)
        max_ind = row.index(extrema)
        title = cols[max_ind]
        method = title.split()[0][1:-1]
        weights_inter = " ".join(title.split()[1:])
        print('Weights: ', title)
        weight_vals = weights_inter.split(',')
        exp_weight = float(weight_vals[0].split()[-1])
        eff_weight = float(weight_vals[1].split()[-1])*2
        ses_weight = float(weight_vals[2].split()[-1])
        pop_weight = float(weight_vals[3].split()[-1])
        weights = {
            'environmental exposure factors': exp_weight,
            'environmental effect factors': eff_weight,
            'socioeconomic factors': ses_weight,
            'health factors': pop_weight,
        }

        wgtfreq = {
            0.5: [],
            1: [],
            2: []
        }

        for factor, value in weights.items():
            wgtfreq[value].append(factor) 
        
        for weight, factors in wgtfreq.items():
            if weight == 1:
                regmsg = ' '
                if len(factors) == 1:
                    regmsg += f'{factors[0]}'
                elif len(factors) == 2:
                    regmsg += " as well as ".join(factors)
                elif len(factors) > 2:
                    regmsg += ", ".join(factors[:-1]) + f", and {factors[-1]}"
                else:
                    regmsg = ''
                    continue
                regmsg += ' are regularly weighted'

            if weight == 0.5:
                downmsg = ' '
                if len(factors) == 1:
                    downmsg += f'{factors[0]}'
                elif len(factors) == 2:
                    downmsg += " as well as ".join(factors)
                elif len(factors) > 2:
                    downmsg += ", ".join(factors[:-1]) + f", and {factors[-1]}"
                else:
                    downmsg = ''
                    continue
                downmsg += ' are lowly weighted'

            if weight == 2:
                upmsg = ' '
                if len(factors) == 1:
                    upmsg = f'{factors[0]}'
                elif len(factors) == 2:
                    upmsg = " as well as ".join(factors)
                elif len(factors) > 2:
                    upmsg = ", ".join(factors[:-1]) + f", and {factors[-1]}"
                else:
                    upmsg = ''
                    continue
                upmsg += ' are highly weighted'
        if (upmsg != '' and regmsg != '' and downmsg != ''):
            finalmsg = upmsg + ',' + regmsg + ', and' + downmsg 
        elif (upmsg == '' and regmsg != ''):
            finalmsg =  regmsg + ' and' + downmsg 
        else:
            finalmsg = upmsg + ' and' + regmsg + ''+ downmsg 
        return finalmsg
    
    max_msg = basemsg = 'Your census tract scores highest when ' + generate_message(cols, row_nominmax, max)
    min_msg = basemsg = 'Your census tract scores lowest when' + generate_message(cols, row_nominmax, min)
    range = {
        'max': row['Max'].values[0],
        'min': row['Min'].values[0],
        'default': row['Default_score'].values[0],
        'median': row['Median'].values[0]
    }

    var_message = "This is due to your tract's high {} levels and {} levels, but low {} levels"
    return [max_msg, min_msg, range]

def get_variable_impact(df, env_eff_weight=0.5, env_exp_weight=1, ses_weight=1, pop_weight=1):
    max_env_exp = max(df['env_exposure'])
    max_env_eff = max(df['env_effect'])
    max_pop = max(df['sens_pop'])
    max_ses = max(df['ses_factors'])
    pollution_burden_weight = env_exp_weight + env_eff_weight
    population_burden_weight = ses_weight + pop_weight
    max_score = max(df['Pollution Burden'] * df['Pop Char'])
    def get_category_contributions(row):
        true_score = (row['Pollution Burden']) * row['Pop Char']
        env_eff_control = (row['env_exposure']*env_exp_weight / pollution_burden_weight) * row['Pop Char']
        env_eff_pct = round((true_score - env_eff_control) / true_score, 3) / 2
        env_exp_control = (row['env_effect']*env_eff_weight / pollution_burden_weight) * row['Pop Char']
        env_exp_pct = round((true_score - env_exp_control) / true_score, 3) / 2
        ses_control = row['Pollution Burden'] * (row['sens_pop']*pop_weight / population_burden_weight)
        ses_pct = round((true_score - ses_control) / true_score, 3) / 2
        pop_control = row['Pollution Burden'] * (row['ses_factors']*ses_weight / population_burden_weight)
        pop_pct = round((true_score - pop_control) / true_score, 3) / 2
        return [env_exp_pct, env_eff_pct, ses_pct, pop_pct]
    
    return df.apply(lambda row: get_category_contributions(row), axis=1)

def get_variable_ranks(df, tract):
    row = df.loc[df['Census Tract'] == tract]

    return [row['env_exposure'].values, row['env_effect'].values,
            row['ses_vactors'].values, row['sens_pop'].values]