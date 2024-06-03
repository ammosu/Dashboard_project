// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [colors, setColors] = useState({});

  useEffect(() => {
    // 獲取顏色配置
    axios.get('http://localhost:8000/color-config')
      .then(response => {
        setColors(response.data);
      })
      .catch(error => console.error('Error fetching color config:', error));
    
    axios.get('http://localhost:8000/filters')
      .then(response => {
        setFilters(response.data);
        setSelectedMethod(response.data.evaluation_methods[0]);
        setSelectedAge(response.data.ages[0]);
        setSelectedPeriod(response.data.training_periods[0]);
        setSelectedCounties(response.data.counties); // 初始設置為全選
      })
      .catch(error => console.error('Error fetching filters:', error));
  }, []);

  useEffect(() => {
    if (selectedMethod && selectedAge && selectedPeriod && selectedCounties.length > 0) {
      fetchData();
    }
  }, [selectedMethod, selectedAge, selectedPeriod, selectedCounties]);

  const fetchData = () => {
    console.log('Sending counties:', selectedCounties);
    axios.get('http://localhost:8000/data', {
      params: {
        evaluation_method: selectedMethod,
        age: selectedAge,
        training_period: selectedPeriod,
        counties: selectedCounties
      },
      paramsSerializer: params => {
        const query = new URLSearchParams();
        Object.keys(params).forEach(key => {
          if (Array.isArray(params[key])) {
            params[key].forEach(value => query.append(key, value));
          } else {
            query.append(key, params[key]);
          }
        });
        return query.toString();
      }
    })
    .then(response => {
      const rawData = response.data;
      const formattedData = formatData(rawData);
      setData(formattedData);
      console.log('Filtered data:', formattedData);  // 調試信息
    })
    .catch(error => console.error('Error fetching filtered data:', error));
  };

  const formatData = (rawData) => {
    const groupedData = rawData.reduce((acc, curr) => {
      const county = curr.county;
      if (!acc[county]) {
        acc[county] = { county };
      }
      acc[county][curr.model_category] = curr.evaluation_results;
      return acc;
    }, {});

    return Object.values(groupedData);
  };

  const handleMethodChange = (e) => setSelectedMethod(e.target.value);
  const handleAgeChange = (e) => setSelectedAge(parseFloat(e.target.value));
  const handlePeriodChange = (e) => setSelectedPeriod(parseInt(e.target.value, 10));
  
  const toggleCounty = (county) => {
    const updatedCounties = selectedCounties.includes(county)
      ? selectedCounties.filter(c => c !== county)
      : [...selectedCounties, county];
    setSelectedCounties(updatedCounties);
  };

  const categories = [...new Set(data.flatMap(item => Object.keys(item).filter(key => key !== 'county')))];

  return (
    <div className="App" style={{ fontFamily: 'Roboto, sans-serif', color: '#333' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '0.5em' }}>評估結果儀表板</h1>
      <div className="filters" style={{ marginBottom: '2em', display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '1em' }}>評估方法:</label>
          <select value={selectedMethod} onChange={handleMethodChange} style={{ padding: '0.5em', fontSize: '1em', width: '100%' }}>
            {filters.evaluation_methods?.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '1em' }}>屋齡:</label>
          <select value={selectedAge} onChange={handleAgeChange} style={{ padding: '0.5em', fontSize: '1em', width: '100%' }}>
            {filters.ages?.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '1em' }}>最後訓練時間:</label>
          <select value={selectedPeriod} onChange={handlePeriodChange} style={{ padding: '0.5em', fontSize: '1em', width: '100%' }}>
            {filters.training_periods?.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 100%', minWidth: '200px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '1em' }}>縣市:</label>
          <div>
            {filters.counties?.map(county => (
              <button
                key={county}
                onClick={() => toggleCounty(county)}
                style={{
                  backgroundColor: selectedCounties.includes(county) ? '#2e91d9' : 'white',
                  color: selectedCounties.includes(county) ? 'white' : 'black',
                  margin: '5px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {county}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <BarChart data={data}>
          <XAxis dataKey="county" interval={0} tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0, right: 0 }} />
          {categories.map(category => (
            <Bar key={category} dataKey={category} name={category} fill={colors[category] || '#FFBB28'} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default App;
