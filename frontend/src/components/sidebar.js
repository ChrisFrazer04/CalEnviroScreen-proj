import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Sidebar = ({ onVariableSubmit, triggerMapUpdate, weights, sliders, triggerVisUpdate}) => {
  const [envExp, setEnvExp] = useState({
    ozone: true, pm25: true, dieselP: true, drinkingWater: true, lead: true, 
    pesticides: true, toxRelease: true, traffic: true
  });
  const [envEff, setEnvEff] = useState({
      cleanupSites: true, groundwaterThreats: true, hazWaste: true, impWaterBodies: true, solidWaste: true
  });
  const [sesVars, setSesVars] = useState({
      education: true, linguisticIsolation: true, poverty: true, unemployment: true, housingBurden: true
  });
  const [popVars, setPopVars] = useState({
      asthma: true, lowBirthWeight: true, cardiovascularDisease: true,
      cancer: false, copd: false, smoking: false, cdc_asthma: false, ckd: false, cvd: false
  });
  const [cdcHealthFactors, setCdcHealthFactors] = useState({
      cancer: false, copd: false, smoking: false, cdc_asthma: false, ckd: false, cvd: false
  });

  const [aggMethod, setAggMethod] = useState(' Pctl')
  const [calcMethod, setCalcMethod] = useState('')
  const [variableData, setVariableData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sliderTrigger, setSliderTrigger] = useState('false')

  //console.log('Sliders: ', sliders)

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

  const handleCheckboxChange = (group, setGroup, key) => {
      const groupState = { ...group };
      const isChecked = groupState[key];
      
      // Prevent unchecking if it's the last one checked in the group
      if (isChecked && Object.values(groupState).filter(Boolean).length === 1) {
          return;
      }
      
      groupState[key] = !isChecked;
      setGroup(groupState);
  };

  const handleEnvExpChange = (key) => handleCheckboxChange(envExp, setEnvExp, key);
  const handleEnvEffChange = (key) => handleCheckboxChange(envEff, setEnvEff, key);
  const handleSesVarsChange = (key) => handleCheckboxChange(sesVars, setSesVars, key);
  const handlePopVarsChange = (key) => handleCheckboxChange(popVars, setPopVars, key);


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
    //console.log('BIGDATA', data)
    //onVariableSubmit(data)
    //setVariableData(data);
    return data;
  }

  const sendData = async (data) => {
    //console.log('started');
    //console.log('data:', data)

    try {
      const res = await axios.post('https://calenviroscreen-proj-production.up.railway.app/api/data', data);
      triggerVisUpdate()
      triggerMapUpdate()
    } catch (error) {
      console.error('Error sending data:', error);
    }

    setSubmitted(true);
  };

  const SidebarSubmit = ({onVariableSubmit}) => {

    const handleClick = () => {
      const data = updateData()
      //console.log(data)
      setVariableData(data);
      sendData(data)
      //triggerVisUpdate()
      //triggerMapUpdate()
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
        //console.log('Slider Update data', data)
        setVariableData(data);
        //triggerVisUpdate()
        sendData(data)
        setSliderTrigger(false)
      }
      handleSliderUpdate()
    } else{
    }
  }, [sliders])


  const MathChangeMethods = () => {
    //Holds code for adding the aggregation and calculation method options. Currently nonfunctional. Paste after the last checkbox group
    return (
      <div className='placeholder'>
        <hr />
      <div className='radio-group'>
          <h3 className='checkbox-header'>Aggregation Method</h3>
          <label htmlFor="cb28" className="checkbox-label">
              <input type='radio' name='agg_method' className='agg_method' id='cb28' value=' Pctl' checked={aggMethod === ' Pctl'} onChange={handleAggChange} /> Percentile
          </label>
          <label htmlFor="cb29" className="checkbox-label">
              <input type='radio' name='agg_method' className='agg_method' id='cb29' value='' checked={aggMethod === ''} onChange={handleAggChange} /> Raw Counts
          </label>
          <label htmlFor="cb30" className="checkbox-label">
              <input type='radio' name='agg_method' className='agg_method' id='cb30' value=' Scaled' checked={aggMethod === ' Scaled'} onChange={handleAggChange} /> Scaled
          </label>
      </div>
      <hr />
      <div className='radio-group'>
          <h3 className='checkbox-header'>Calculation Method</h3>
          <label htmlFor="cb31" className="checkbox-label">
              <input type='radio' name='calc_method' className='calc_method' id='cb31' value='' checked={calcMethod === ''} onChange={handleCalcChange} /> Default
          </label>
          <label htmlFor="cb32" className="checkbox-label">
              <input type='radio' name='calc_method' className='calc_method' id='cb32' value='avg' checked={calcMethod === 'avg'} onChange={handleCalcChange} /> Average
          </label>
      </div>
      </div>
    )
  }


  return (
    <div className='sidebar'>
        <div className='checkbox-group'>
            <h3 className='checkbox-header'>Environmental Exposure Factors</h3>
            <label htmlFor="cb1" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Ozone' id='cb1' checked={envExp.ozone} onChange={() => handleEnvExpChange('ozone')} /> Ozone Concentration
            </label>
            <label htmlFor="cb2" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='PM2.5' id='cb2' checked={envExp.pm25} onChange={() => handleEnvExpChange('pm25')} /> PM 2.5 Concentration
            </label>
            <label htmlFor="cb3" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Diesel PM' id='cb3' checked={envExp.dieselP} onChange={() => handleEnvExpChange('dieselP')} /> Diesel PM Emissions
            </label>
            <label htmlFor="cb4" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Drinking Water' id='cb4' checked={envExp.drinkingWater} onChange={() => handleEnvExpChange('drinkingWater')} /> Drinking Water Contaminants
            </label>
            <label htmlFor="cb5" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Lead' id='cb5' checked={envExp.lead} onChange={() => handleEnvExpChange('lead')} /> Children's Lead Risk
            </label>
            <label htmlFor="cb6" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Pesticides' id='cb6' checked={envExp.pesticides} onChange={() => handleEnvExpChange('pesticides')} /> Pesticides
            </label>
            <label htmlFor="cb7" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Tox. Release' id='cb7' checked={envExp.toxRelease} onChange={() => handleEnvExpChange('toxRelease')} /> Toxic Releases from Facilities
            </label>
            <label htmlFor="cb8" className="checkbox-label">
                <input type='checkbox' className='env_exp' value='Traffic' id='cb8' checked={envExp.traffic} onChange={() => handleEnvExpChange('traffic')} /> Traffic
            </label>
        </div>
        <hr />
        <div className='checkbox-group'>
            <h3 className='checkbox-header'>Environmental Effect Factors</h3>
            <label htmlFor="cb9" className="checkbox-label">
                <input type='checkbox' className='env_eff' value='Cleanup Sites' id='cb9' checked={envEff.cleanupSites} onChange={() => handleEnvEffChange('cleanupSites')} /> Cleanup Sites
            </label>
            <label htmlFor="cb10" className="checkbox-label">
                <input type='checkbox' className='env_eff' value='Groundwater Threats' id='cb10' checked={envEff.groundwaterThreats} onChange={() => handleEnvEffChange('groundwaterThreats')} /> Groundwater Threats
            </label>
            <label htmlFor="cb11" className="checkbox-label">
                <input type='checkbox' className='env_eff' value='Haz. Waste' id='cb11' checked={envEff.hazWaste} onChange={() => handleEnvEffChange('hazWaste')} /> Hazardous Waste
            </label>
            <label htmlFor="cb12" className="checkbox-label">
                <input type='checkbox' className='env_eff' value='Imp. Water Bodies' id='cb12' checked={envEff.impWaterBodies} onChange={() => handleEnvEffChange('impWaterBodies')} /> Impaired Water Bodies
            </label>
            <label htmlFor="cb13" className="checkbox-label">
                <input type='checkbox' className='env_eff' value='Solid Waste' id='cb13' checked={envEff.solidWaste} onChange={() => handleEnvEffChange('solidWaste')} /> Solid Waste Sites and Facilities
            </label>
        </div>
        <hr />
        <div className='checkbox-group'>
            <h3 className='checkbox-header'>Socioeconomic Factors</h3>
            <label htmlFor="cb14" className="checkbox-label">
                <input type='checkbox' className='ses_vars' value='Education' id='cb14' checked={sesVars.education} onChange={() => handleSesVarsChange('education')} /> Educational Attainment
            </label>
            <label htmlFor="cb15" className="checkbox-label">
                <input type='checkbox' className='ses_vars' value='Linguistic Isolation' id='cb15' checked={sesVars.linguisticIsolation} onChange={() => handleSesVarsChange('linguisticIsolation')} /> Linguistic Isolation
            </label>
            <label htmlFor="cb16" className="checkbox-label">
                <input type='checkbox' className='ses_vars' value='Poverty' id='cb16' checked={sesVars.poverty} onChange={() => handleSesVarsChange('poverty')} /> Poverty
            </label>
            <label htmlFor="cb17" className="checkbox-label">
                <input type='checkbox' className='ses_vars' value='Unemployment' id='cb17' checked={sesVars.unemployment} onChange={() => handleSesVarsChange('unemployment')} /> Unemployment
            </label>
            <label htmlFor="cb18" className="checkbox-label">
                <input type='checkbox' className='ses_vars' value='Housing Burden' id='cb18' checked={sesVars.housingBurden} onChange={() => handleSesVarsChange('housingBurden')} /> Housing-Burdened Low Income Households
            </label>
        </div>
        <hr />
        <div className='checkbox-group'>
            <h3 className='checkbox-header'>CalEnviroScreen Health Factors</h3>
            <label htmlFor="cb19" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='Asthma' id='cb19' checked={popVars.asthma} onChange={() => handlePopVarsChange('asthma')} /> Asthma-Related ER Visits
            </label>
            <label htmlFor="cb20" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='Low Birth Weight' id='cb20' checked={popVars.lowBirthWeight} onChange={() => handlePopVarsChange('lowBirthWeight')} /> Low Birth Weight
            </label>
            <label htmlFor="cb21" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='Cardiovascular Disease' id='cb21' checked={popVars.cardiovascularDisease} onChange={() => handlePopVarsChange('cardiovascularDisease')} /> Heart Attack ER Visits
            </label>
        </div>
        <hr />
        <div className='checkbox-group'>
            <h3 className='checkbox-header'>CDC Health Factors</h3>
            <label htmlFor="cb22" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='CDC_Cancer' id='cb22' checked={popVars.cancer} onChange={() => handlePopVarsChange('cancer')} /> Cancer among Adults
            </label>
            <label htmlFor="cb23" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='CDC_COPD' id='cb23' checked={popVars.copd} onChange={() => handlePopVarsChange('copd')} /> Chronic Obstructive Pulmonary Diseases (COPD)
            </label>
            <label htmlFor="cb24" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='CDC_Smoking' id='cb24' checked={popVars.smoking} onChange={() => handlePopVarsChange('smoking')} /> Smoking
            </label>
            <label htmlFor="cb25" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='CDC_Asthma' id='cb25' checked={popVars.cdc_asthma} onChange={() => handlePopVarsChange('cdc_asthma')} /> Asthma among adults
            </label>
            <label htmlFor="cb26" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='CDC_CKD' id='cb26' checked={popVars.ckd} onChange={() => handlePopVarsChange('ckd')} /> Chronic Kidney Disease
            </label>
            <label htmlFor="cb27" className="checkbox-label">
                <input type='checkbox' className='pop_vars' value='CDC_CVD' id='cb27' checked={popVars.cvd} onChange={() => handlePopVarsChange('cvd')} /> Coronary Heart Disease
            </label>
        </div>
        <hr className='final-break'/>
        <SidebarSubmit />
    </div>
);

}

export default Sidebar