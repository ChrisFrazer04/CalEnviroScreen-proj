import React, { useState,  useEffect} from 'react';
import axios from 'axios';

const TractDropdown = ({county}) => {
    const [tractOptions, setTractOptions] = useState([]);
    const [selectedTract, setSelectedTract] = useState('Select Tract:');

    useEffect(() => {
        const getTracts = async () => {
            if (county !== 'Select County:') {
                let data = { county: county };
                try {
                    const response = await axios.post('http://127.0.0.1:5000/tract_dropdown', data);
                    setOptions(response.data);
                    console.log(response);
                } catch (error) {
                    console.error("Error sending data:", error);
                }
            } else {
                setOptions([]); // Reset options if 'Select County:' is selected
            }
        };

        getTracts();
    }, [county]);

    const handleSelectionChange = (event) => {
        setSelectedTract(event.target.value);
    };


    return(
    <select value={selectedTract} onChange={handleSelectionChange}>
        <option value="Select Tract:" disabled>Select Tract:</option>
        {options.map(option =>
                <option key={option.tract} value={option.tract}>{option.tract}</option>
            )}
    </select>)
}

export default TractDropdown