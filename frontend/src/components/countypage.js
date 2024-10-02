import React, { useState, useEffect } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import axios from 'axios';
import Dropdowns from './dropdown';


const CountyDropdown = ( {onCountyChange} ) => {
    const [countyOptions, setCountyOptions] = useState([])

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/county_dropdown').then(response => {
            setCountyOptions(response.data)
            // console.log(options)
        }).catch(error => {
            console.error("Erorr fetching options:", error)
        })
    }, [])

    const handleCountyChange1 = (e) => {
        const county = e.target.value;
        onCountyChange(county);
    };

    return(
        <select onChange={handleCountyChange1} className='dropdown'>
            <option value="Select County:">Select County:</option>
            {countyOptions.map(CountyOption =>
                <option key={CountyOption.County} value={CountyOption.County}>{CountyOption.County}</option>
            )}
        </select>
    )
}



const TractDropdown = ({county, onTractChange}) => {    
    const [tractOptions, setTractOptions] = useState([]);
    const [mapHtml, setMapHtml] = useState('');

    useEffect(() => {
        if (county !== 'Select County:') {
            axios.post('http://127.0.0.1:5000/api/gen_map', { county })
                .then(response => {
                    setMapHtml(response.data.map);
                })
                .catch(error => {
                    console.error("Error fetching map:", error);
                });
        } else {
            setTractOptions([]); // Reset options if 'Select County:' is selected
        }
    }, [county]);

    useEffect(() => {
        // Function to handle the message from the map
        const handleMapClick = (event) => {
          const data = JSON.parse(event.data)
          const tract = data.tract
          onTractChange(tract)
          //console.log('data', data)
          //console.log('tract', tract)
        };
    
        window.addEventListener('message', handleMapClick);
    
        return () => {
          window.removeEventListener('message', handleMapClick);
        };
      }, []);

    const handleTractChange1 = (event) => {
        const tract = event.target.value
        onTractChange(tract)
        // console.log('htc1', tract)
    }

    return (
    <div className='county-map-div'>
        <div dangerouslySetInnerHTML={{ __html: mapHtml }} className='county-map'/>
    </div>
    )
}


const GeneratePieChart = ({pieData}) => {
    const pieColors = ['#3FCF35', '#358CCF', '#C535CF', '#CF7835']
    console.log('Piedata:', pieData)

    const CustomTooltip = ({ payload, label, active}) => {
        if (active && payload && payload.length) {
            let percent = (Math.round(payload[0].value * 10000) / 100).toFixed(2)
          return (
            <div className="custom-tooltip">
              <p className="tooltip-value">{`${payload[0].name}: ${percent}%`}</p>
            </div>
          );
        }
    }

    return (
        <div className='pie-chart-div'>
            <p className='plot-label'>Category Contribution to Overall Rank</p>
            <div className='pie-chart'>
            <ResponsiveContainer >
                <PieChart width={400} height={400}>
                    <Pie data={pieData} dataKey='value' >
                    {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={CustomTooltip}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
            </div>
            
        </div>
    )
}

const GenerateOverallRadial = ({radialData}) => {
    //const score = radialData['4']['value']
    //console.log('SCORE', score)

    const CustomTooltip = ({ payload, label, active}) => {
        if (active && payload && payload.length) {
          return (
            <div className="custom-tooltip">
              <p className="tooltip-value">{`Percentile Rank: ${payload[0].value}`}</p>
            </div>
          );
        }
    }

    return(
        <div className='overall-radial-container'>
            <div className='overall-radial'>
                <ResponsiveContainer >
                    <RadialBarChart 
                        innerRadius="30%" 
                        outerRadius="100%" 
                        data={Array(radialData['4'])} 
                        startAngle={180} 
                        endAngle={0}
                    >
                    <RadialBar minAngle={15} background={{'fill': '#CBCACA'}} clockWise={true} dataKey='value'/>
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                    />
                    <Legend />
                    <Tooltip  content={<CustomTooltip />}/>
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

const GenerateCategoryRadial = ({radialData}) => {
    //console.log('Radial Data', radialData)
    //console.log(Array(radialData['0']))
    const data =[{
        'name': 'tester',
        'value': 20,
        'fill': "#3FCF35"
    }]

    const CustomTooltip = ({ payload, label, active, title }) => {
        if (active && payload && payload.length) {
          return (
            <div className="custom-tooltip">
              <p className="tooltip-value">{`Percentile Rank: ${payload[0].value}`}</p>
            </div>
          );
        }
    }

    return (
        <div className='radial-charts'>
            <div className='radial-chart'>
            <ResponsiveContainer >
                <RadialBarChart 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    data={Array(radialData['0'])} 
                    startAngle={180} 
                    endAngle={0}
                >
                <RadialBar minAngle={15} background={{'fill': '#CBCACA'}} clockWise={true} dataKey='value'/>
                <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                />
                <Legend />
                <Tooltip  content={<CustomTooltip />} />
                </RadialBarChart>
            </ResponsiveContainer>
            </div>
            <div className='radial-chart'>
            <ResponsiveContainer >
                <RadialBarChart 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    data={Array(radialData['1'])} 
                    startAngle={180} 
                    endAngle={0}
                >
                <RadialBar minAngle={15} background={{'fill': '#CBCACA'}} clockWise={true} dataKey='value'/>
                <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                />
                <Legend />
                <Tooltip  content={<CustomTooltip />} />
                </RadialBarChart>
            </ResponsiveContainer>
            </div>
            <div className='radial-chart'>
            <ResponsiveContainer >
                <RadialBarChart 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    data={Array(radialData['2'])} 
                    startAngle={180} 
                    endAngle={0}
                >
                <RadialBar minAngle={15} background={{'fill': '#CBCACA'}} clockWise={true} dataKey='value'/>
                <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                />
                <Legend />
                <Tooltip  content={<CustomTooltip />} />
                </RadialBarChart>
            </ResponsiveContainer>
            </div>
            <div className='radial-chart'>
            <ResponsiveContainer >
                <RadialBarChart 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    data={Array(radialData['3'])} 
                    startAngle={180} 
                    endAngle={0}
                >
                <RadialBar minAngle={15} background={{'fill': '#CBCACA'}} clockWise={true} dataKey='value'/>
                <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                />
                <Legend />
                <Tooltip  content={<CustomTooltip />} />
                </RadialBarChart>
            </ResponsiveContainer>
            </div>
        </div>
    );
}

const CountyPage = ({tract, loadPage, onCountyChange, onTractChange, weights, updateVis, tractSelected}) =>  {
    const [defaultPerc, setDefaultPerc] = useState(null)
    const [pieData, setPieData] = useState([])
    const [radialData, setRadialData] = useState([])
    const [selectedWeights, setSelectedWeights] = useState(weights)
    //const [tractSelected, setTractSelected] = useState(false)
    //console.log('Profile Weight', weights)
    //console.log('SELECTED TRACT:!:!:0', tractSelected)
    console.log('Tract: ', tract)

    useEffect(() => {
        if (tract !== 'Select Tract:') {
            axios.post('http://127.0.0.1:5000/profile/default_rationale', { tract })
                .then(response => {
                    setDefaultPerc(response.data.range)
                    setPieData(response.data.piechart)
                    setRadialData(response.data.radialchart)
                    //console.log('Data', response.data)
                })
                .catch(error => {
                    console.error("Error fetching options:", error);
                });
        } else {
        }
    }, [tract]);

    useEffect(() => {
        if (JSON.stringify(weights) !== JSON.stringify(selectedWeights)) {
            setSelectedWeights(weights);
        }
    }, [weights, selectedWeights]);
    
    //Generates visualizations after sliders or variables are upated 
    useEffect(() => {
        if (tract !== 'Select Tract:' && updateVis != 0) {
            const data = {
                'tract': tract,
                'weights': selectedWeights,
            }
            //console.log('Triggered', data)
            axios.post('http://127.0.0.1:5000/profile/dynamic_rationale', { data })
                .then(response => {
                    setPieData(response.data.piechart)
                    setRadialData(response.data.radialchart)
                    //console.log('Data', response.data)
                })
                .catch(error => {
                    console.error("Error fetching options:", error);
                });
        } else {
        }
    }, [tract, updateVis]);


    return(
        <div className='slide'>
            <div>
                    <div className='dashboard-box' id='dashboard-box-2'>
                        <div className='top-row'>
                            <div className='main-box' id='box1'>
                                <Dropdowns onCountyChange={onCountyChange} onTractChange={onTractChange} />
                            </div>
                            <div className='main-box'id='box2'>
                            `   <p className='section-label'>Tract: {tract}</p>
                                <GenerateOverallRadial radialData={radialData}/>
                            </div>
                        </div>
                        <div className='bottom-row'>
                            <div className='main-box' id='box3'>
                                <p className='plot-label'>Category Ranks {tract}</p>
                                <GenerateCategoryRadial radialData={radialData}/>
                            </div>
                            <div className='main-box' id='box4'>
                                <GeneratePieChart  pieData={pieData}/>
                            </div>
                        </div>
                    </div> 
            </div>
        </div>
    )
}

export default CountyPage