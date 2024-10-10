import React, { useState, useEffect } from 'react';
import WeightSliders from './components/sliders';
import Dropdowns from './components/dropdown';
import CountyPage from './components/countypage';
import Sidebar from './components/sidebar';
import ModelExplanation from './modelExplanation';
import axios from 'axios';
import './App.css';
import StatePage from './components/statepage';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

//Backend host URL: https://calenviroscreen-proj-production.up.railway.app

function App() {
  //user-inputted variables
  const [county, setCounty] = useState('Select County:')
  const [selectedTract, setTract] = useState(6037532002)
  const [defaultScore, setDefaultScore] = useState('Pending')
  const [expWeight, setExpWeight] = useState(1)
  const [effWeight, setEffWeight] = useState(0.5)
  const [sesWeight, setSesWeight] = useState(1)
  const [popWeight, setPopWeight] = useState(1)
  const [weights, setWeights] = useState({
    'exp_weight': expWeight,
    'eff_weight': effWeight,
    'ses_weight': sesWeight,
    'pop_weight': popWeight
})
  const [updateMap, setUpdateMap] = useState(1)
  const [variableData, setVariableData] = useState({})
  const [sliderTrigger, setSliderTrigger] = useState(0)
  const [visUpdate, setVisUpdate] = useState(0)
  const [tractSelected, setTractSelected] = useState(false)
  const [currentPage, setCurrentPage] = useState('statePage')
  const [modelExpand, setModelExpand] = useState(true)
  const [pageComponent, setPageComponent] = useState(<StatePage updateMap={updateMap}/>)

  const handleTractChange = (selectedTract) => {
    setTract(selectedTract);
    setTractSelected(true)
    // console.log('Frontend tract:', selectedTract)
  };

  const handleCountyChange = (county) =>{
    setCounty(county)
    //console.log('Frontend County:', county)
  }

  const getDefaultScore = (defaultScore) => {
    setDefaultScore(defaultScore)
  }

  const handleExpChange = (wgt) => {
    setExpWeight(wgt)
    setWeights([wgt, expWeight, sesWeight, popWeight])
    //console.log('Frontend Weights: ', weights)
  }

  const handleWeightChange = (wgts) => {
    setWeights(wgts)
  }

  const handleEffChange = (wgt) => {
    setEffWeight(wgt)
    setWeights([expWeight, wgt, sesWeight, popWeight])
    //console.log('Frontend Weights: ', wgt)
  }

  const handleSesChange = (wgt) => {
    setSesWeight(wgt)
    setWeights([expWeight, effWeight, wgt, popWeight])
    //console.log('Frontend Weights: ', weights)
  }

  const handlePopChange = (wgt) => {
    setPopWeight(wgt)
    setWeights([expWeight, effWeight, sesWeight, wgt])
    //console.log('Frontend Weights: ', weights)
  }

  const handleUpdateMap = (update) => {
    let mapcount = updateMap + 1
    setUpdateMap(mapcount)
    //console.log('Map Updated')
    
  }

  const handleVariableChange = (variables) => {
    setVariableData(variables)
    //console.log('Frontend Variables :', variableData)
  }

  const handleSliderUpdate = () => {
    const currentSlider = sliderTrigger + 1
    setSliderTrigger(currentSlider)
    //console.log('Slider Trigger Handled')
  }

  const handleVisUpdate = () => {
    const currentVis = visUpdate + 1
    setVisUpdate(currentVis)
    //console.log('Vis Updated')
  }

  const pageToggle = () => {
    if (currentPage === 'statePage'){
      //currentPage = 'countyPage'
      setCurrentPage('countyPage')
    } else {
      // currentPage = 'statePage'
      setCurrentPage('statePage')
    }
    console.log('Page:', currentPage)
  }

  const modelToggle = () => {
    setModelExpand(!modelExpand)
}

  //HTML
  return(
  <div className='body'>
    <div className='header'><h1 className='header-text'>CalEnviroVisualizer</h1></div>
    <div className='main'>
      <Sidebar onVariableSubmit={handleVariableChange} triggerMapUpdate={handleUpdateMap} weights={weights} sliders={sliderTrigger}
      triggerVisUpdate={handleVisUpdate} triggerSliderUpdate={handleSliderUpdate} onWeightChange={handleWeightChange} tractSelected={tractSelected}/>
    <div className="content"> 
      <div className='page-toggle-div' value={currentPage}>
        <button id='page-toggle'  onClick={pageToggle}/>
        <label for='page-toggle' id='page-toggle-button'>
          <div id='state-button'>State-View</div>
          <div id='county-button'>County-View</div>
        </label>
      </div>
      <SwitchTransition mode='out-in'>
        <CSSTransition key={currentPage} timeout={300} classNames='slide' unmountOnExit>
          {
            currentPage === 'statePage' ? <StatePage updateMap={updateMap} /> :
            <CountyPage tract={selectedTract} onTractChange={handleTractChange} weights={weights} 
            updateVis={visUpdate} onCountyChange={handleCountyChange}/>
          }
        </CSSTransition>
      </SwitchTransition>
      <button className='model-toggle' onClick={modelToggle} aria-expanded={modelExpand}>
        About CalEnviroScreen <div className='caret'>▴</div></button>   
      <CSSTransition in={modelExpand} classNames='model-explanation' timeout={300} unmountOnExit>
        <ModelExplanation />
      </CSSTransition>  
      <div className='footer'></div>
    </div>
    </div>
  </div>
  
  );
}

export default App

//localhost: http://127.0.0.1:5000

// <WeightSliders tract={selectedTract} onExpChange={handleExpChange} onEffChange={handleEffChange}
// onSesChange={handleSesChange} onPopChange={handlePopChange} factors={variableData} triggerMapUpdate={handleUpdateMap}
// onWeightChange={handleWeightChange} triggerSliderUpdate={handleSliderUpdate} tractSelected={tractSelected}/>