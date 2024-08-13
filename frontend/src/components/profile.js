import React, { useState, useEffect } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import axios from 'axios';

const Profile = ({tract, onTractChange, weights, updateVis, tractSelected}) =>  {
    const [maxMsg, setMaxMsg] = useState()
    const [minMsg, setMinMsg] = useState()
    const [defaultPerc, setDefaultPerc] = useState(null)
    const [pieData, setPieData] = useState([])
    const [radialData, setRadialData] = useState([])
    const [selectedWeights, setSelectedWeights] = useState(weights)
    //const [tractSelected, setTractSelected] = useState(false)
    console.log('Profile Weight', weights)
    console.log('SELECTED TRACT:!:!:0', tractSelected)

    useEffect(() => {
        if (tract !== 'Select Tract:') {
            axios.post('http://127.0.0.1:5000/profile/default_rationale', { tract })
                .then(response => {
                    setMaxMsg(response.data.maxmsg);
                    setMinMsg(response.data.minmsg);
                    setDefaultPerc(response.data.range)
                    setPieData(response.data.piechart)
                    setRadialData(response.data.radialchart)
                    console.log('Data', response.data)
                })
                .catch(error => {
                    console.error("Error fetching options:", error);
                });
        } else {
            setMaxMsg();
            setMinMsg();
            setDefaultPerc(null)
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
            console.log('Triggered', data)
            axios.post('http://127.0.0.1:5000/profile/dynamic_rationale', { data })
                .then(response => {
                    setMaxMsg(response.data.maxmsg);
                    setMinMsg(response.data.minmsg);
                    setDefaultPerc(response.data.range)
                    setPieData(response.data.piechart)
                    setRadialData(response.data.radialchart)
                    console.log('Data', response.data)
                })
                .catch(error => {
                    console.error("Error fetching options:", error);
                });
        } else {
            setMaxMsg();
            setMinMsg();
            setDefaultPerc(null)
        }
    }, [tract, updateVis]);

    useEffect(() => {
        if (defaultPerc !== null) {
            onTractChange(defaultPerc);
        }
    }, [defaultPerc, onTractChange]);

    const GeneratePieChart = ({pieData}) => {
        const pieColors = ['#3FCF35', '#358CCF', '#C535CF', '#CF7835']
        console.log('Piedata:', pieData)

        return (
            <div className='pie-chart-div'>
                <p className='plot-label'>Score breakdown by category importance</p>
                <div className='pie-chart'>
                <ResponsiveContainer >
                    <PieChart width={400} height={400}>
                        <Pie data={pieData} dataKey='value' >
                        {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
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

        const CustomTooltip = ({ payload, label, active, title }) => {
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
                <p className='plot-label'>Overall Score: </p>
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
        console.log('Radial Data', radialData)
        console.log(Array(radialData['0']))
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

    
    



    return(
        <div>
            {tractSelected && (
            <div class='profile-container'> 
                <div class='profile'>
                    <div className='overall-radial-div'>
                        <GenerateOverallRadial radialData={radialData}/>
                    </div>
                    <div className='score-equation'>
                        <p className='plot-label'>Category Ranks</p>
                        <GenerateCategoryRadial radialData={radialData}/>
                    </div>
                    <div className='dual-panel'>
                        <GeneratePieChart  pieData={pieData}/>
                    </div>
            </div>
        </div>
        )}
        </div>
    )
}

export default Profile