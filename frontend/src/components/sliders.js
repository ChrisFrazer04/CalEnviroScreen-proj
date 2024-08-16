import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeightSliders = ({ tract, triggerMapUpdate, onWeightChange, tractSelected,
                    onEffChange, onExpChange, onPopChange, onSesChange, triggerSliderUpdate}) => {
        const [expWeight, setExpWeight] = useState(1);
        const [effWeight, setEffWeight] = useState(0.5);
        const [sesWeight, setSesWeight] = useState(1);
        const [popWeight, setPopWeight] = useState(1);
        const [selectedTract, setSelectedTract] = useState(tract);
        const [weights, setWeights] = useState({});

        const ResetVariable = () => {
            // Put the content of this variable into the main WeightSliders variable if you want the sliders to 
            // reset when a different county is selected (this does NOT update the weight on the backend)
            useEffect(() => {
                setExpWeight(1);
                setEffWeight(0.5);
                setSesWeight(1);
                setPopWeight(1);
                setSelectedTract(tract);
            }, [tract]);
            
        }
        
        const UpdateOnSliderMovement = () => {
            //Delete this variable (put its contents into the main variable) if you want to send weight
            //updates to the main app as the occur rather than on submit press
            useEffect(() => {
                onExpChange(expWeight)
                console.log('Exp Changed')
            }, [expWeight])

            useEffect(() => {
                onEffChange(effWeight)
            }, [effWeight])

            useEffect(() => {
                onSesChange(sesWeight)
            }, [sesWeight])

            useEffect(() => {
                onPopChange(popWeight)
            }, [popWeight])
        }

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

        const SubmitButton = ({onWeightChange, triggerSliderUpdate}) => {
            
            const submit = () => {
                const data = {
                    'exp_weight': expWeight,
                    'eff_weight': effWeight,
                    'ses_weight': sesWeight,
                    'pop_weight': popWeight
                }
                onWeightChange(data)
                triggerSliderUpdate()
                // triggerMapUpdate()
            }

            const submitMap = () => {
                submit()
                triggerMapUpdate()
            }

            const optimize = () => {
                
            }

            return (
                <div class='slider-submit-buttons'>
                    <button className='slider-submit' type='submit' onClick={submit}>Update </button>
                    <button className='slider-submit' type='submit' onClick={submitMap}>Update & Regenerate Map</button>
                </div>
                
            )
        }

    return (
        <div className='sliders-container'>
            {tractSelected && (
                <div className='sliders'>
                    <p className='plot-label'>Customize Category Weights:</p>
                <div className='environmental-sliders'>
                    <div className='slider-div'>
                        <p className='slider-label'>Environmental Exposure Weight: {expWeight}</p>
                        <input className='slider' type='range' min='0.5' max='2' step='0.05' value={expWeight} onChange={handleExpChange}/>
                        
                    </div>
                    <div className='slider-div'>
                        <p className='slider-label'>Environmental Effect Weight: {effWeight}</p>
                        <input className='slider' type='range' min='0.25' max='1' step='0.05' value={effWeight} onChange={handleEffChange}/>
                    </div>
                </div>
                <div className='population-sliders'>
                    <div className='slider-div'>
                        <p className='slider-label'>Socieconomic Factor Weight: {sesWeight}</p>
                        <input className='slider' type='range' min='0.5' max='2' step='0.05' value={sesWeight} onChange={handleSesChange}/>                
                    </div>
                    <div className='slider-div'>
                        <p className='slider-label'>Health Factor Weight: {popWeight}</p>
                        <input className='slider' type='range' min='0.5' max='2' step='0.05' value={popWeight} onChange={handlePopChange}/>                
                    </div>
                </div>
                <SubmitButton onWeightChange={onWeightChange} triggerSliderUpdate={triggerSliderUpdate}/>
                
                </div>
            )}
        </div>
    );
};

export default WeightSliders