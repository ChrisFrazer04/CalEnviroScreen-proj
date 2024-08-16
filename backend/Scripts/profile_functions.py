import pandas as pd
import numpy as np
from pathlib import Path
import math
import json
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))


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
    env_weights = env_eff_weight + env_exp_weight
    other_weights = ses_weight + pop_weight
    def get_category_contributions(row):
        #Calculating individual weighted category scores
        env_exp = row['env_exposure'] * env_exp_weight
        env_eff = row['env_effect'] * env_eff_weight
        ses = row['ses_factors'] * ses_weight
        pop = row['sens_pop'] * pop_weight
        #Calculating category contributions
        env_score = (env_exp + env_eff) / env_weights
        other_score = (ses + pop) / other_weights
        env_contribution = env_score / (env_score + other_score)
        other_contribution = other_score / (env_score + other_score)
        #Calculating subcategory contributions
        env_exp_cont = round(env_contribution * (env_exp / (env_exp + env_eff)), 3)
        env_eff_cont = round(env_contribution * (env_eff / (env_exp + env_eff)), 3)
        ses_cont = round(other_contribution * (ses / (ses + pop)), 3)
        pop_cont =round(other_contribution * (pop / (ses + pop)), 3)
        return [env_exp_cont, env_eff_cont, ses_cont, pop_cont]
    
    return df.apply(get_category_contributions, axis=1)

def get_variable_ranks(df, tract):
    row = df.loc[df['Census Tract'] == tract]

    return [row['env_exposure'].values, row['env_effect'].values,
            row['ses_vactors'].values, row['sens_pop'].values]