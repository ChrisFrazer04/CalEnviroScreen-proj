import React, { useState, useEffect } from 'react';
import WeightSliders from './components/sliders';
import Dropdowns from './components/dropdown';
import Profile from './components/profile';
import Sidebar from './components/sidebar';
import LandingMap from './components/maps';
import axios from 'axios';
import './App.css';

function App() {
  //user-inputted variables
  const [county, setCounty] = useState('Select County:')
  const [selectedTract, setTract] = useState('Select Tract:')
  const [defaultScore, setDefaultScore] = useState('Pending')
  const [expWeight, setExpWeight] = useState(1)
  const [effWeight, setEffWeight] = useState(0.5)
  const [sesWeight, setSesWeight] = useState(1)
  const [popWeight, setPopWeight] = useState(1)
  const [weights, setWeights] = useState([expWeight, effWeight, sesWeight, popWeight])
  const [updateMap, setUpdateMap] = useState(1)
  const [variableData, setVariableData] = useState({})
  const [sliderTrigger, setSliderTrigger] = useState(0)
  const [visUpdate, setVisUpdate] = useState(0)

  const handleTractChange = (selectedTract) => {
    setTract(selectedTract);
    // console.log('Frontend tract:', selectedTract)
  };

  const handleCountyChange = (county) =>{
    setCounty(county)
    console.log('Frontend County:', county)
  }

  const getDefaultScore = (defaultScore) => {
    setDefaultScore(defaultScore)
  }

  const handleExpChange = (wgt) => {
    setExpWeight(wgt)
    setWeights([wgt, expWeight, sesWeight, popWeight])
    console.log('Frontend Weights: ', weights)
  }

  const handleWeightChange = (wgts) => {
    setWeights(wgts)
  }

  const handleEffChange = (wgt) => {
    setEffWeight(wgt)
    setWeights([expWeight, wgt, sesWeight, popWeight])
    console.log('Frontend Weights: ', wgt)
  }

  const handleSesChange = (wgt) => {
    setSesWeight(wgt)
    setWeights([expWeight, effWeight, wgt, popWeight])
    console.log('Frontend Weights: ', weights)
  }

  const handlePopChange = (wgt) => {
    setPopWeight(wgt)
    setWeights([expWeight, effWeight, sesWeight, wgt])
    console.log('Frontend Weights: ', weights)
  }

  const handleUpdateMap = (update) => {
    let mapcount = updateMap + 1
    setUpdateMap(mapcount)
    console.log('Map Updated')
    
  }

  const handleVariableChange = (variables) => {
    setVariableData(variables)
    console.log('Frontend Variables :', variableData)
  }

  const handleSliderUpdate = () => {
    const currentSlider = sliderTrigger + 1
    setSliderTrigger(currentSlider)
    console.log('Slider Trigger Handled')
  }

  const handleVisUpdate = () => {
    const currentVis = visUpdate + 1
    setVisUpdate(currentVis)
    console.log('Vis Updated')
  }
  //HTML
  return(
  <div className='body'>
    <div className='header'><h1 className='header-text'>CalEnviroScreen Visualizer</h1></div>
    <div className='main'>
      <Sidebar onVariableSubmit={handleVariableChange} triggerMapUpdate={handleUpdateMap} weights={weights} sliders={sliderTrigger}
      triggerVisUpdate={handleVisUpdate}/>
    <div className="content">
      <LandingMap updateMap={updateMap}/>
      <Dropdowns onCountyChange={handleCountyChange} onTractChange={handleTractChange} />
      <Profile tract={selectedTract} onTractChange={getDefaultScore} weights={weights} updateVis={visUpdate}/>
      <WeightSliders tract={selectedTract} defaultPerc={defaultScore} onExpChange={handleExpChange} onEffChange={handleEffChange}
      onSesChange={handleSesChange} onPopChange={handlePopChange} factors={variableData} triggerMapUpdate={handleUpdateMap}
      onWeightChange={handleWeightChange} triggerSliderUpdate={handleSliderUpdate}/>
    </div>
    </div>
  </div>
  
  );
}

export default App