import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LandingMap = ({ updateMap }) => {
    const [mapHtml, setMapHtml] = useState('');


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

    return (
        <div className='landing-map-div'> 
            <div dangerouslySetInnerHTML={{ __html: mapHtml }} className='landing-map'/>
        </div>
    );
};

export default LandingMap;