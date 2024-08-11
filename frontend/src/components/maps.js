import React, { useEffect, useState } from 'react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import axios from 'axios';

const LandingMap = ({ updateMap }) => {
    const [mapHtml, setMapHtml] = useState('');
    const [disadData, setDisadData] = useState([])
    const [nonDisadData, setNonDisadData] = useState([])
    const [countyBreakdown, setCountyBreakdown] = useState([])


    useEffect(() => {
        const fetchMap = async () => {
            try {
                console.log('Map Updated in Backend')
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
          console.log('data', data)
        };
    
        window.addEventListener('message', handleMapClick);
    
        return () => {
          window.removeEventListener('message', handleMapClick);
        };
      }, []);
    
    useEffect(() => {
        try{
            axios.get('http://127.0.0.1:5000/profile/overall_graphs').then(response => {
                setCountyBreakdown(response.data.disadvantagedBar);
                setDisadData(response.data.racialDisadvantaged)
                setNonDisadData(response.data.racialNonDisadvantaged)
            })
            console.log('County Breakdown Data', countyBreakdown)
        } catch (error) {
            console.log('Error fetching map figures')
        }
    }, [updateMap])

    const CountyBarplot = ({data}) => {

        const CustomTooltip = ({ payload, label, active }) => {
            if (active && payload && payload.length) {
              return (
                <div className="custom-tooltip">
                  <p className="label">{`${label} : ${payload[0].value}`}</p>
                  <p className="intro">{`Percent Disadvantaged: ${payload[0].value}`}</p>
                </div>
              );
            }
        }
        
        return(
            <div className='county-barplot-div'>
                <p className='plot-label'>Percent of Tracts which are Disadvantaged by County</p>
                <div className='county-barplot'>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                    >
                        <XAxis dataKey='name'/>
                        <YAxis domain={[0, 100]} label={{ value: '% Disadvantaged', angle: -90, position: 'centerLeft', offset: 20}}/>
                        <Tooltip content={<CustomTooltip />}/>
                        <Legend />
                        <Bar dataKey='value' fill='#82ca9d'/>
                    </BarChart>
                </ResponsiveContainer>
                </div>
                
            </div>
        )
    }


    const DemographicPlot = ({yesDacData, noDacData}) => {
        const colors = ['#48b10a', '#0a9cb1', '#730ab1', '#b1200a', '#d17b14', '#d1c914', '#142cd1', '#d11461']
        return(
            <div className='demographic-plot-container'>
                <div className='demographic-plot-div'>
                    <p className='plot-label'>Demographics of Non-Disadvantaged Tracts</p>
                    <div className='demographic-plot'>
                        <ResponsiveContainer >
                            <PieChart>
                                <Pie data={noDacData} dataKey='value' >
                                {noDacData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className='demographic-plot-div'>
                    <p className='plot-label last-label'>Demographics of Disadvantaged Tracts</p>
                    <div className='demographic-plot last-plot'>
                        <ResponsiveContainer >
                            <PieChart >
                                <Pie data={yesDacData} dataKey='value' >
                                {yesDacData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                </div>
            </div>
        )
    }

    return (
        <div> 
            <div className='landing-map-div'>
                <div dangerouslySetInnerHTML={{ __html: mapHtml }} className='landing-map'/>
            </div>   
            <div className='general-map-plots'>
                <CountyBarplot data={countyBreakdown}/>
                <DemographicPlot yesDacData={disadData} noDacData={nonDisadData} />
            </div>
            
        </div>
    );
};


export default LandingMap;