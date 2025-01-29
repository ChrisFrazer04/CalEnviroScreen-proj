import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSSTransition } from 'react-transition-group';

const Sidebar = ({ onVariableSubmit, triggerMapUpdate, sliders, 
  triggerVisUpdate, onWeightChange, triggerSliderUpdate}) => {

  // Use localStorage to persist data
  const loadPersistedState = (key, defaultValue) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };

  const saveToLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };
  const defaultEnvExp = {
    ozone: true, pm25: true, dieselP: true, drinkingWater: true, lead: true, 
    pesticides: true, toxRelease: true, traffic: true
  }
  const defaultEnvEff = {
    cleanupSites: true, groundwaterThreats: true, 
    hazWaste: true, impWaterBodies: true, solidWaste: true
}
  const defaultSesVars = {
    education: true, linguisticIsolation: true, 
    poverty: true, unemployment: true, housingBurden: true
}
  const defaultPopVars = {
    asthma: true, lowBirthWeight: true, cardiovascularDisease: true,
    cancer: false, copd: false, smoking: false, 
    cdc_asthma: false, ckd: false, cvd: false
}
  const [envExp, setEnvExp] = useState(loadPersistedState('envExp', defaultEnvExp));
  const [envEff, setEnvEff] = useState(loadPersistedState('envEff', defaultEnvEff));
  const [sesVars, setSesVars] = useState(loadPersistedState('sesVars', defaultSesVars));
  const [popVars, setPopVars] = useState(loadPersistedState('popVars', defaultPopVars));

  const [aggMethod, setAggMethod] = useState(' Pctl')
  const [calcMethod, setCalcMethod] = useState('')
  

  //Slider Variables
  const [expWeight, setExpWeight] = useState(loadPersistedState('expWeight', 1));
  const [effWeight, setEffWeight] = useState(loadPersistedState('effWeight', 0.5));
  const [sesWeight, setSesWeight] = useState(loadPersistedState('sesWeight', 1));
  const [popWeight, setPopWeight] = useState(loadPersistedState('popWeight', 1));
  //const [selectedTract, setSelectedTract] = useState(tract);
  const [weights, setWeights] = useState({});

  const [expExpand, setExpExpand] = useState(true)
  const [effExpand, setEffExpand] = useState(true)
  const [sesExpand, setSesExpand] = useState(true)
  const [popExpand, setPopExpand] = useState(true)

  const [variableData, setVariableData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sliderTrigger, setSliderTrigger] = useState('false')
  const [loading, setLoading] = useState(false)


  // Save state changes to localStorage
  useEffect(() => {
    saveToLocalStorage('envExp', envExp);
    saveToLocalStorage('envEff', envEff);
    saveToLocalStorage('sesVars', sesVars);
    saveToLocalStorage('popVars', popVars);
    saveToLocalStorage('aggMethod', aggMethod);
    saveToLocalStorage('calcMethod', calcMethod);
    saveToLocalStorage('expWeight', expWeight);
    saveToLocalStorage('effWeight', effWeight);
    saveToLocalStorage('sesWeight', sesWeight);
    saveToLocalStorage('popWeight', popWeight);
  }, [envExp, envEff, sesVars, popVars, aggMethod, calcMethod, expWeight, effWeight, sesWeight, popWeight]);

  //console.log('Sliders: ', weights)
  useEffect(() => {
    setEnvEff(defaultEnvEff)
    setEnvExp(defaultEnvExp)
    setSesVars(defaultSesVars)
    setPopVars(defaultPopVars)
    setExpWeight(1)
    setEffWeight(0.5)
    setSesWeight(1)
    setPopWeight(1)
  }, [])

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

  // Weight Slider Functions

  const handleExpChange = (event) => {
    let weight = event.target.value
    setExpWeight(weight)
  }

  const handleEffChange = (event) => {
      let weight = event.target.value
      setEffWeight(weight)
  }

  const handleSesChange = (event) => {
      let weight = event.target.value
      setSesWeight(weight)
  }

  const handlePopChange = (event) => {
      let weight = event.target.value
      setPopWeight(weight)
  }

  //Toggles for expandable categories
  const expToggle = () => {
    setExpExpand(!expExpand)
  }

  const effToggle = () => {
    setEffExpand(!effExpand)
  }

  const sesToggle = () => {
    setSesExpand(!sesExpand)
  }

  const popToggle = () => {
    setPopExpand(!popExpand)
  }



  const updateData = () => {
    let env_eff = [];
    let env_exp = [];
    let ses_vars = [];
    let pop_vars = [];
    let suffix = aggMethod;
    let cmethod = calcMethod;
    let newWeights = {
      'exp_weight': expWeight,
      'eff_weight': effWeight,
      'ses_weight': sesWeight,
      'pop_weight': popWeight
    }

    const varMap = {
      ozone: "Ozone", pm25: "PM2.5", dieselP: "Diesel PM", 
      drinkingWater: "Drinking Water", lead: "Lead", 
      pesticides: "Pesticides", toxRelease: "Tox. Release", traffic: "Traffic",
      cleanupSites: "Cleanup Sites", groundwaterThreats: "Groundwater Threats", hazWaste: "Haz. Waste", 
      impWaterBodies: "Imp. Water Bodies", solidWaste: "Solid Waste",
      education: "Education", linguisticIsolation: "Linguistic Isolation", poverty: "Poverty", 
      unemployment: "Unemployment", housingBurden: "Housing Burden",
      asthma: "Asthma", lowBirthWeight: "Low Birth Weight", cardiovascularDisease: "Cardiovascular Disease", 
      cancer: "CDC_Cancer", copd: "CDC_COPD", smoking: "CDC_Smoking", 
      cdc_asthma: "CDC_Asthma", ckd: "CDC_CKD", cvd: "CDC_CVD"
    }

    setWeights(newWeights)
    onWeightChange(newWeights) // Might be unnecessary now

    Object.entries(envExp).map(([key, val]) => 
      {if (val) env_exp.push(varMap[key])
      }
    )

    Object.entries(envEff).map(([key, val]) => 
      {if (val) env_eff.push(varMap[key])
      }
    )

    Object.entries(sesVars).map(([key, val]) => 
      {if (val) ses_vars.push(varMap[key])
      }
    )

    Object.entries(popVars).map(([key, val]) => 
      {if (val) pop_vars.push(varMap[key])
      }
    )

    let data = {
      "env_eff_vars": env_eff,
      "env_exp_vars": env_exp,
      "ses_vars": ses_vars,
      "pop_vars": pop_vars,
      "suffix": suffix,
      "calc_method": cmethod,
      'weights': newWeights
    };
    
    return data;
  }

  const waitForDataProcessing = async () => {
    while (true) {
      try {
        console.log('Waiting...')
        // GET request to check the status
        const resp = await axios.get('https://calenviroscreen-proj-production.up.railway.app/api/status');
        if (resp.data.status === 'complete') {
          // Exit the loop if processing is complete
          return;
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
  
      // Wait for a while before the next check
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const sendData = async (data) => {
    try {
      const res = await axios.post('https://calenviroscreen-proj-production.up.railway.app/api/data', data);
      await waitForDataProcessing()
      console.log('Done Waiting')
      triggerVisUpdate()
      setLoading(false)
    } catch (error) {
      console.error('Error sending data:', error);
    }

    setSubmitted(true);
  };

  const SidebarSubmit = ({onVariableSubmit}) => {

    const submitData = () => {
      const data = updateData()
      console.log('Sent to backend:', data)
      sendData(data)
      setVariableData(data)
      setLoading(true)
    }

    const submitMap = () => {
      submitData()
      triggerMapUpdate()
    }

    return (
      <div className='submit-div'>
        <button className='submit' id='update-button' type='submit' onClick={submitMap}>Update</button>
      </div>
    );
  };

  const SidebarLoading = ({}) => {
    return (
      <div className='submit-div'>
        <button className='submit' >Updating...</button>
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




  return (
    <div className='sidebar'>
      <div className='title'><h1 className='title-text'>CalEnviroVisualizer</h1></div>
      <hr className='title-break'/>
        <div className='checkbox-group'>
            <button className='checkbox-header' id='ch-1' onClick={expToggle} aria-expanded={expExpand}>
              Environmental Exposure Factors <div className='caret'>▴</div>
              </button>
            <CSSTransition in={expExpand} timeout={300} classNames='checkbox-content-1' unmountOnExit>
              <div className='checkbox-content-1'>
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
                <div className='slider-div'>
                  <p className='slider-label'>Category Weight: {expWeight}</p>
                  <input className='slider' type='range' min='0.5' max='2' step='0.05' value={expWeight} onChange={handleExpChange}/>
                </div>
              </div>
            </CSSTransition>
        </div>
        <hr />
        <div className='checkbox-group'>
            <button className='checkbox-header' id='ch-2' onClick={effToggle} aria-expanded={effExpand}>
              Environmental Effect Factors <div className='caret'>▴</div></button>
            <CSSTransition in={effExpand} timeout={300} classNames='checkbox-content-2' unmountOnExit>
              <div className='checkbox-content-2'>
                <label htmlFor="cb9" className="checkbox-label">
                  <input type='checkbox' className='env_eff' value='Cleanup Sites' id='cb9' checked={envEff.cleanupSites} onChange={() => handleEnvEffChange('cleanupSites')} /> Cleanup Sites
                </label>
                <label htmlFor="cb10" className="checkbox-label">
                    <input type='checkbox' className='env_eff cbox' value='Groundwater Threats' id='cb10' checked={envEff.groundwaterThreats} onChange={() => handleEnvEffChange('groundwaterThreats')} /> Groundwater Threats
                </label>
                <label htmlFor="cb11" className="checkbox-label">
                    <input type='checkbox' className='env_eff cbox' value='Haz. Waste' id='cb11' checked={envEff.hazWaste} onChange={() => handleEnvEffChange('hazWaste')} /> Hazardous Waste
                </label>
                <label htmlFor="cb12" className="checkbox-label">
                    <input type='checkbox' className='env_eff cbox' value='Imp. Water Bodies' id='cb12' checked={envEff.impWaterBodies} onChange={() => handleEnvEffChange('impWaterBodies')} /> Impaired Water Bodies
                </label>
                <label htmlFor="cb13" className="checkbox-label">
                    <input type='checkbox' className='env_eff cbox' value='Solid Waste' id='cb13' checked={envEff.solidWaste} onChange={() => handleEnvEffChange('solidWaste')} /> Solid Waste Sites and Facilities
                </label>
                <div className='slider-div'>
                    <p className='slider-label'>Category Weight: {effWeight}</p>
                    <input className='slider' type='range' min='0.25' max='1' step='0.05' value={effWeight} onChange={handleEffChange}/>
                </div>
                </div>
              </CSSTransition>
        </div>
        <hr />
        <div className='checkbox-group'>
            <button className='checkbox-header' id='ch-3' onClick={sesToggle} aria-expanded={sesExpand}
            >Socioeconomic Factors<div className='caret'>▴</div></button>
            <CSSTransition in={sesExpand} timeout={300} classNames='checkbox-content-3' unmountOnExit>
              <div className='checkbox-content-3'>
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
                <div className='slider-div'>
                    <p className='slider-label'>Category Weight: {sesWeight}</p>
                    <input className='slider' type='range' min='0.5' max='2' step='0.05' value={sesWeight} onChange={handleSesChange}/>                
                </div>
              </div>
            </CSSTransition>            
        </div>
        <hr />
        <div className='checkbox-group'>
            <button className='checkbox-header' id='ch-4' onClick={popToggle} aria-expanded={popExpand}>
            Health Factors<div className='caret'>▴</div></button>
            <CSSTransition in={popExpand} timeout={300} classNames='checkbox-content-4' unmountOnExit>
              <div className='checkbox-content-4'>
                <label htmlFor="cb19" className="checkbox-label">
                  <input type='checkbox' className='pop_vars' value='Asthma' id='cb19' checked={popVars.asthma} onChange={() => handlePopVarsChange('asthma')} /> Asthma-Related Emergency Room Visits
                </label>
                <label htmlFor="cb20" className="checkbox-label">
                    <input type='checkbox' className='pop_vars' value='Low Birth Weight' id='cb20' checked={popVars.lowBirthWeight} onChange={() => handlePopVarsChange('lowBirthWeight')} /> Low Birth Weight
                </label>
                <label htmlFor="cb21" className="checkbox-label">
                    <input type='checkbox' className='pop_vars' value='Cardiovascular Disease' id='cb21' checked={popVars.cardiovascularDisease} onChange={() => handlePopVarsChange('cardiovascularDisease')} /> Heart Attack Emergency Room Visits
                </label>
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
                <div className='slider-div'>
                    <p className='slider-label'>Category Weight: {popWeight}</p>
                    <input className='slider' type='range' min='0.5' max='2' step='0.05' value={popWeight} onChange={handlePopChange}/>                
                </div>
              </div>
            </CSSTransition>            
        </div>
        <hr className='final-break'/>
        {
          loading === false ? <SidebarSubmit /> : <SidebarLoading />
        }
        
    </div>
);

}

export default Sidebar