import React, { useEffect, useState } from 'react';

const ModelExplanation = () => {

    const BLOCK1 = 'The CalEnviroScreen algorithm quantifies how “disadvantaged” a census tract is by combining a variety of environmental and socioeconomic factors which impact one’s quality of life into a singular score. For each factor, all of which are listed in the left panel, census tracts are ranked based on how impacted they are by that factor, with a percentile ranking of 100 representing the most impacted tract and 0 representing the least impacted. Every factor is then assigned to one of 4 categories, which act as “umbrellas” for similar factors. To calculate a tract’s final score, the model first finds the average rank of factors within each category, as shown below:'
    const BLOCK2 = 'Then, the model separately takes the weighted averages of the Environmental effect and environmental exposure scores as well as the population health and socioeconomic scores. These averages are then multiplied together to compute the final score.'
    const BLOCK3 = 'Tracts in the top 25% of scores are designated as disadvantaged, thus receiving funding set aside by the state for disadvantaged tracts. Using this tool, you can modify the weights of each category as well as what factors are included in the model to see the potential impact on your tract or county.'
    return(
        <div className='model-explanation'>
            <h2>What is CalEnviroScreen?</h2>
            <div className='text-block'>{BLOCK1}</div>
            <div className='category-diagram-div'>
                <div className='diagram-label-div'>
                    <p>General Formula</p>
                    <img className='category-diagram' src={`${process.env.PUBLIC_URL}/General_Category_Diagram.png`} alt="Diagram for Category Score" />
                </div>
                <div className='diagram-label-div'>
                    <p>Population Health Formula</p>
                    <img className='category-diagram' src={`${process.env.PUBLIC_URL}/Specific_Category_Diagram.png`} alt="Diagram for Category Score" />
                </div>
                
                
            </div>
            <div className='text-block'>{BLOCK2}</div>
            <img className='score-diagram' src={`${process.env.PUBLIC_URL}/Overall_Score_Diagram.png`} alt="Diagram for Overall Score" />
            <div className='text-block'>{BLOCK3}</div>
        </div>
    )
}

export default ModelExplanation;