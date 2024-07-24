import React, { useState, useEffect } from 'react';
import axios from 'axios';


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
          console.log('data', data)
          console.log('tract', tract)
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

const Dropdowns = ({onTractChange, onCountyChange}) => {
    const [selectedCounty, setSelectedCounty] = useState('Select County:');
    const [selectedTract, setSelectedTract] = useState('Select Tract:');


    const handleCountyChange = (county) => {
        setSelectedCounty(county);
        onCountyChange(county);  // Pass the selected county up to the parent component
      };

    return (
        <div className='search-area'>
            <h3>Find your Tract!</h3>
            <CountyDropdown onCountyChange={handleCountyChange} />
            {selectedCounty !== 'Select County:' && (
                <TractDropdown county={selectedCounty} onTractChange={onTractChange}/>
            )}
        </div>
    );
};

export default Dropdowns