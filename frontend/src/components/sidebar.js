import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Sidebar = ({ onVariableSubmit, triggerMapUpdate, weights, sliders, triggerVisUpdate}) => {
  // Env_exp_vars
  const [ozone, changeOz] = useState(true);
  const [pm25, changePM] = useState(true);
  const [dieselP, changeDies] = useState(true);
  const [drinkingWater, changeDrink] = useState(true);
  const [lead, changeLead] = useState(true);
  const [pesticides, changePest] = useState(true);
  const [toxRelease, changeTox] = useState(true);
  const [traffic, changeTraffic] = useState(true);
  // Enf_eff_vars
  const [cleanupSites, changeClean] = useState(true);
  const [groundwaterThreats, changeGround] = useState(true);
  const [hazWaste, changeHaz] = useState(true);
  const [impWaterBodies, changeImp] = useState(true);
  const [solidWaste, changeSol] = useState(true);
  // Socioeconomic_vars
  const [education, chagneEdu] = useState(true);
  const [linguisticIsolation, changeLing] = useState(true);
  const [poverty, changePov] = useState(true);
  const [unemployment, changeUnemp] = useState(true);
  const [housingBurden, changeHous] = useState(true);
  // CalEnviroScreen Health Factors
  const [asthma, changeAst] = useState(true);
  const [lowBirthWeight, changeLBW] = useState(true);
  const [cardiovascularDisease, changeCardio] = useState(true);
  // CDC Health Factors
  const [cancer, changeCancer] = useState(false);
  const [copd, changeCopd] = useState(false);
  const [smoking, changeSmok] = useState(false);
  const [cdc_asthma, changeAstCdc] = useState(false);
  const [ckd, changeCKD] = useState(false);
  const [cvd, changeCVD] = useState(false);
  //
  const [aggMethod, setAggMethod] = useState(' Pctl')
  const [calcMethod, setCalcMethod] = useState('')
  const [variableData, setVariableData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sliderTrigger, setSliderTrigger] = useState('false')

  console.log('Sliders: ', sliders)

  // Changes state of checkbox buttons on click
  function toggleButton(state) {
    return !state;
  }

  // Changes value of aggregation method radio buttons on click
  const handleAggChange = (event) => {
    setAggMethod(event.target.value);
  };

  // Changes value of calculation method radio buttons on click
  const handleCalcChange = (event) => {
    setCalcMethod(event.target.value);
  };

  const updateData = () => {
    let env_eff = [];
    let env_exp = [];
    let ses_vars = [];
    let pop_vars = [];
    let suffix = aggMethod;
    let cmethod = calcMethod;

    document.querySelectorAll('.env_exp').forEach(factor => {
      if (factor.checked) env_exp.push(factor.value);
    });

    document.querySelectorAll('.env_eff').forEach(factor => {
      if (factor.checked) env_eff.push(factor.value);
    });

    document.querySelectorAll('.ses_vars').forEach(factor => {
      if (factor.checked) ses_vars.push(factor.value);
    });

    document.querySelectorAll('.pop_vars').forEach(factor => {
      if (factor.checked) pop_vars.push(factor.value);
    });

    let data = {
      "env_eff_vars": env_eff,
      "env_exp_vars": env_exp,
      "ses_vars": ses_vars,
      "pop_vars": pop_vars,
      "suffix": suffix,
      "calc_method": cmethod,
      'weights': weights
    };
    console.log('BIGDATA', data)
    //onVariableSubmit(data)
    //setVariableData(data);
    return data;
  }

  const sendData = async (data) => {
    console.log('started');
    console.log('data:', data)

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/data', data);
      triggerVisUpdate()
    } catch (error) {
      console.error('Error sending data:', error);
    }

    setSubmitted(true);
  };

  const SidebarSubmit = ({onVariableSubmit, triggerMapUpdate}) => {

    const handleClick = () => {
      const data = updateData()
      console.log(data)
      setVariableData(data);
      sendData(data)
      //triggerVisUpdate()
      triggerMapUpdate()
    }

    return (
      <div className='submit-div'>
        <button className='submit' type='submit' onClick={handleClick}>Calculate</button>
      </div>
    );
  };

  useEffect(() => {
    if (sliders !== 0) {
      const handleSliderUpdate = () => {
        const data = updateData()
        console.log('Slider Update data', data)
        setVariableData(data);
        //triggerVisUpdate()
        sendData(data)
        setSliderTrigger(false)
      }
      handleSliderUpdate()
    } else{
    }
  }, [sliders])


    return(
        <div className='sidebar'>
    <div className='checkbox-group'>
      <h3 class='checkbox-header'>Environmental Exposure Factors</h3>
      <label htmlFor="cb1" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb1' checked={ozone} value='Ozone' onClick={() => changeOz(toggleButton(ozone))}/> Ozone Concentration</label>
      <label htmlFor="cb2" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb2' checked={pm25} value='PM2.5' onClick={() => changePM(toggleButton(pm25))}/> Pm 2.5 Concentration</label>
      <label htmlFor="cb3" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb3' checked={dieselP} value='Diesel PM' onClick={() => changeDies(toggleButton(dieselP))}/> Diesel PM Emissions</label>
      <label htmlFor="cb4" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb4' checked={drinkingWater} value='Drinking Water' onClick={() => changeDrink(toggleButton(drinkingWater))}/> Drinking Water Contaminants</label>
      <label htmlFor="cb5" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb5' checked={lead} value='Lead' onClick={() => changeLead(toggleButton(lead))}/> Children's Lead Risk</label>
      <label htmlFor="cb6" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb6' checked={pesticides} value='Pesticides' onClick={() => changePest(toggleButton(pesticides))}/> Pesticides</label>
      <label htmlFor="cb7" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb7' checked={toxRelease} value='Tox. Release' onClick={() => changeTox(toggleButton(toxRelease))}/> Toxic Releases from Facilities</label>
      <label htmlFor="cb8" class="checkbox-label">
      <input type='checkbox'className='env_exp' id='cb8' checked={traffic} value='Traffic' onClick={() => changeTraffic(toggleButton(traffic))}/> Traffic</label>
    </div>
    <hr></hr>
    <div className='checkbox-group'>
      <h3 class='checkbox-header'>Environmental Effect Factors</h3>
      <label htmlFor="cb9" class="checkbox-label">
      <input type='checkbox'className='env_eff' id='cb9' checked={cleanupSites} value='Cleanup Sites' onClick={() => changeClean(toggleButton(cleanupSites))}/> Cleanup Sites</label>
      <label htmlFor="cb10" class="checkbox-label">
      <input type='checkbox'className='env_eff' id='cb10' checked={groundwaterThreats} value='Groundwater Threats' onClick={() => changeGround(toggleButton(groundwaterThreats))}/> Groundwater Threats</label>
      <label htmlFor="cb11" class="checkbox-label">
      <input type='checkbox'className='env_eff' id='cb11' checked={hazWaste} value='Haz. Waste' onClick={() => changeHaz(toggleButton(hazWaste))}/> Hazardous Waste</label>
      <label htmlFor="cb12" class="checkbox-label">
      <input type='checkbox'className='env_eff' id='cb12' checked={impWaterBodies} value='Imp. Water Bodies' onClick={() => changeImp(toggleButton(impWaterBodies))}/> Impaired Water Bodies</label>
      <label htmlFor="cb13" class="checkbox-label">
      <input type='checkbox'className='env_eff' id='cb13' checked={solidWaste} value='Solid Waste' onClick={() => changeSol(toggleButton(solidWaste))}/> Solid Waste Sites and Facilities</label>
    </div>
    <hr></hr>
    <div className='checkbox-group'>
      <h3 class='checkbox-header'>Socieoeonomic Factors</h3>
      <label htmlFor="cb14" class="checkbox-label">
      <input type='checkbox'className='ses_vars' id='cb14' checked={education} value='Education' onClick={() => chagneEdu(toggleButton(education))}/> Educational Attainment</label>
      <label htmlFor="cb15" class="checkbox-label">
      <input type='checkbox'className='ses_vars' id='cb15' checked={linguisticIsolation} value='Linguistic Isolation' onClick={() => changeLing(toggleButton(linguisticIsolation))}/> Linguistic Isolation</label>
      <label htmlFor="cb16" class="checkbox-label">
      <input type='checkbox'className='ses_vars' id='cb16' checked={poverty} value='Poverty' onClick={() => changePov(toggleButton(poverty))}/> Poverty</label>
      <label htmlFor="cb17" class="checkbox-label">
      <input type='checkbox'className='ses_vars' id='cb17' checked={unemployment} value='Unemployment' onClick={() => changeUnemp(toggleButton(unemployment))}/> Unemployment</label>
      <label htmlFor="cb18" class="checkbox-label">
      <input type='checkbox'className='ses_vars' id='cb18' checked={housingBurden} value='Housing Burden' onClick={() => changeHous(toggleButton(housingBurden))}/> Housing-Burdened Low Income Households</label>
    </div>
    <hr></hr>
    <div className='checkbox-group'>
      <h3 class='checkbox-header'>CalEnviroScreen Health Factors</h3>
      <label htmlFor="cb19" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb19' checked={asthma} value='Asthma' onClick={() => changeAst(toggleButton(asthma))}/> Asthma-Related ER Visits</label>
      <label htmlFor="cb20" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb20' checked={lowBirthWeight} value='Low Birth Weight' onClick={() => changeLBW(toggleButton(lowBirthWeight))}/> Low Birth Weight</label>
      <label htmlFor="cb21" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb21' checked={cardiovascularDisease} value='Cardiovascular Disease' onClick={() => changeCardio(toggleButton(cardiovascularDisease))}/> Heart Attack ER Visits</label>
    </div>
    <hr></hr>
    <div className='checkbox-group'>
      <h3 class='checkbox-header'> CDC Health Factors</h3>
      <label htmlFor="cb22" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb22' checked={cancer} value='CDC_Cancer' onClick={() => changeCancer(toggleButton(cancer))}/> Cancer among Adults</label>
      <label htmlFor="cb23" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb23' checked={copd} value='CDC_COPD' onClick={() => changeCopd(toggleButton(copd))}/> Chronic Obstructive Pulmonary Diseases (COPD)</label>
      <label htmlFor="cb24" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb24' checked={smoking} value='CDC_Smoking' onClick={() => changeSmok(toggleButton(smoking))}/> Smoking</label>
      <label htmlFor="cb25" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb25' checked={cdc_asthma} value='CDC_Asthma' onClick={() => changeAstCdc(toggleButton(cdc_asthma))}/> Asthma among adults</label>
      <label htmlFor="cb26" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb26' checked={ckd} value='CDC_CKD' onClick={() => changeCKD(toggleButton(ckd))}/>Chronic Kidney Disease</label>
      <label htmlFor="cb27" class="checkbox-label">
      <input type='checkbox'className='pop_vars' id='cb27' checked={cvd} value='CDC_CVD' onClick={() => changeCVD(toggleButton(cvd))}/>Coronary Heart Disease</label>
    </div>
    <hr></hr>
    <div className='radio-group'>
      <h3 class='checkbox-header'>Aggregation Method</h3>
      <label htmlFor="cb28" class="checkbox-label">
      <input type='radio' name='agg_method' className='agg_method' id='cb28' value=' Pctl' checked={aggMethod === ' Pctl'} onChange={handleAggChange} /> Percentile</label>
      <label htmlFor="cb29" class="checkbox-label">
      <input type='radio' name='agg_method' className='agg_method' id='cb29' value='' checked={aggMethod === ''} onChange={handleAggChange} /> Raw Counts</label>
      <label htmlFor="cb30" class="checkbox-label">
      <input type='radio' name='agg_method' className='agg_method' id='cb30' value=' Scaled' checked={aggMethod === ' Scaled'} onChange={handleAggChange} /> Scaled</label>
    </div>
    <hr></hr>
    <div className='radio-group'> 
      <h3 class='checkbox-header'>Calculation Method</h3>
      <label htmlFor="cb31" class="checkbox-label">
      <input type='radio' name='calc_method' className='calc_method' id='cb31' value='' checked={calcMethod === ''} onChange={handleCalcChange} /> Default</label>
      <label htmlFor="cb32" class="checkbox-label">
      <input type='radio' name='calc_method' className='calc_method' id='cb32' value='avg' checked={calcMethod === 'avg'} onChange={handleCalcChange} /> Average</label>
    </div>
    <SidebarSubmit triggerMapUpdate={triggerMapUpdate}/>
    </div>
    )

}

export default Sidebar