import React, { useEffect, useState } from 'react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import axios from 'axios';

const CountyBarplot = ({data}) => {
    //console.log('Barplot Data: ', data)

    const sortedCounties = data.sort((a, b) => b.value - a.value)

    const CustomTooltip = ({ payload, label, active }) => {
        if (active && payload && payload.length) {
          return (
            <div className="custom-tooltip">
              <p className="tooltip-label">{`${label} County`}</p>
              <p className="tooltip-value">{`Percent Disadvantaged: ${payload[0].value}`}</p>
            </div>
          );
        }
    }

    const CustomYAxisLabel = ({ viewBox, value }) => {
        const { x, y } = viewBox;
        return (
          <text
            x={x - 40} // Adjust this value for horizontal spacing
            y={y + (viewBox.height / 2)} // Center the text vertically
            fill="black"
            textAnchor="middle"
            transform={`rotate(-90, ${x - 40}, ${y + (viewBox.height / 2)})`}
          >
            {value}
          </text>
        );
      };
    
    return(
        <div className='county-barplot-div'>
            <p className='plot-label'>Percent of Tracts which are Disadvantaged by County</p>
            <div className='county-barplot'>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedCounties}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                >
                    <XAxis 
                        dataKey='name'
                        tick={false}
                        label={{
                            value: 'Counties',
                            position: 'center',
                            style: { textAnchor: 'middle', fontFamily: 'sans-serif', fill: '#121212' }
                        }}
                        />
                    <YAxis 
                        domain={[0, 100]} 
                        tick={{
                            fill: '#121212',
                            fontFamily: 'sans-serif'
                        }}
                        label={{ 
                            value: '% Disadvantaged', angle: -90, 
                            position: 'insideLeft', offset: 5, 
                            style: { textAnchor: 'middle', fontFamily: 'sans-serif', fill: '#121212' }
                        }} />
                    <Tooltip content={<CustomTooltip />}/>
                    <Bar dataKey='value' fill='#82ca9d'/>
                </BarChart>
            </ResponsiveContainer>
            </div>
            
        </div>
    )
}


const DemographicPlot1 = ({yesDacData, noDacData}) => {
    const colors = ['#48b10a', '#0a9cb1', '#730ab1', '#b1200a', '#d17b14', '#d1c914', '#142cd1', '#d11461']
    //console.log('Right Pie Data: ', yesDacData)

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

    return(
            <div className='demographic-plot-div'>
                <div className='demographic-plot'>
                    <ResponsiveContainer >
                        <PieChart>
                            <Pie data={noDacData} dataKey='value' >
                            {noDacData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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

const DemographicPlot2 = ({yesDacData, noDacData}) => {
    const colors = ['#48b10a', '#0a9cb1', '#730ab1', '#b1200a', '#d17b14', '#d1c914', '#142cd1', '#d11461']
    //console.log('Right Pie Data: ', yesDacData)

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

    return(            
            <div className='demographic-plot-div'>
                <div className='demographic-plot last-plot'>
                    <ResponsiveContainer >
                        <PieChart >
                            <Pie data={yesDacData} dataKey='value' >
                            {yesDacData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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

const StatePage = ({ updateMap, loadPage }) => {
    const [mapHtml, setMapHtml] = useState('');
    const [disadData, setDisadData] = useState([])
    const [nonDisadData, setNonDisadData] = useState([])
    const [countyBreakdown, setCountyBreakdown] = useState([])
    console.log("Statepage Loaded: ", loadPage)

    useEffect(() => {
        const fetchMap = async () => {
            try {
                //console.log('Map Updated in Backend')
                const response = await axios.get('http://127.0.0.1:5000/api/landing_map');
                setMapHtml(response.data.map);
            } catch (error) {
                console.error('Error fetching map:', error);
            }
        };

        fetchMap();
    }, [updateMap]);

    useEffect(() => {
        // Function to handle the data from the map onclick
        const handleMapClick = (event) => {
          const data = event.data
          //console.log('data', data)
        };
    
        window.addEventListener('message', handleMapClick);
    
        return () => {
          window.removeEventListener('message', handleMapClick);
        };
      }, []);
    
    useEffect(() => {
        try{
            
            const response = axios.get('http://127.0.0.1:5000/profile/overall_graphs').then(response => {
                setCountyBreakdown(response.data.disadvantagedBar);
                setDisadData(response.data.racialDisadvantaged)
                setNonDisadData(response.data.racialNonDisadvantaged)
                //console.log('Returned Data:', response.data.disadvantagedBar)
            })
            //console.log('County Breakdown Data', countyBreakdown)
        } catch (error) {
            //console.log('Error fetching map figures')
        }
    }, [updateMap])

    

    return (
        <div className='slide'> 
                <div className='dashboard-box' id='dashboard-box-1'>
                    <div className='top-row'>
                        <div className='main-box' id='box1'>
                            <p className='plot-label'>California Census Tract Status</p>
                            <div dangerouslySetInnerHTML={{ __html: mapHtml }} className='landing-map'/>
                        </div>
                        <div className='vertical-space'></div>
                        <div className='main-box'id='box2'>
                            <CountyBarplot data={countyBreakdown}/>
                        </div>
                    </div>
                    <div className='horizontal-space'></div>
                    <div className='bottom-row'>
                        <div className='main-box' id='box3'>
                            <div className='plot-label'> Demographics: Non-disadvantaged Tracts</div>
                            <DemographicPlot1 noDacData={nonDisadData}/>
                        </div>
                        <div className='vertical-space'></div>
                        <div className='main-box' id='box4'>
                        <div className='plot-label'> Demographics: Disadvantaged Tracts</div>
                            <DemographicPlot2 yesDacData={disadData}/>
                        </div>
                    </div>
                </div>
        </div>
    );
};


export default StatePage;