import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { MILLING_MACHINE_PARAMS } from './InputForm';

const Charts = ({ inputData, result }) => {
  const component = result?.component || "Spindle Unit";
  const params = MILLING_MACHINE_PARAMS[component] || MILLING_MACHINE_PARAMS["Spindle Unit"];

  // Get component-specific parameter names and values based on relevance
  const getComponentParameters = () => {
    const component = result?.component || "Spindle Unit";
    
    // Each component shows only its own relevant parameters
    switch(component) {
      case "Spindle Unit":
        return [
          { name: 'Rotational Speed', value: inputData.param1, unit: 'rpm', relevant: true },
          { name: 'Torque', value: inputData.param2, unit: 'Nm', relevant: true },
          { name: 'Temperature', value: inputData.param3, unit: 'K', relevant: true },
          { name: 'Vibration', value: inputData.param4, unit: 'Hz', relevant: true },
          { name: 'Power Consumption', value: inputData.param5, unit: 'kW', relevant: true }
        ];
      case "Cutting Tool":
        return [
          { name: 'Tool Wear', value: inputData.param1, unit: 'min', relevant: true },
          { name: 'Cutting Force', value: inputData.param2, unit: 'N', relevant: true },
          { name: 'Temperature', value: inputData.param3, unit: 'K', relevant: true },
          { name: 'Vibration', value: inputData.param4, unit: 'Hz', relevant: true },
          { name: 'Feed Rate', value: inputData.param5, unit: 'mm/min', relevant: true }
        ];
      case "Motor Drive System":
        return [
          { name: 'Motor Current', value: inputData.param1, unit: 'A', relevant: true },
          { name: 'Power Output', value: inputData.param2, unit: 'kW', relevant: true },
          { name: 'Temperature', value: inputData.param3, unit: 'K', relevant: true },
          { name: 'Load Factor', value: inputData.param4, unit: '%', relevant: true },
          { name: 'Efficiency', value: inputData.param5, unit: '%', relevant: true }
        ];
      case "Feed Mechanism":
        return [
          { name: 'Feed Rate', value: inputData.param1, unit: 'mm/min', relevant: true },
          { name: 'Axis Position', value: inputData.param2, unit: 'mm', relevant: true },
          { name: 'Load Current', value: inputData.param3, unit: 'A', relevant: true },
          { name: 'Backlash', value: inputData.param4, unit: 'mm', relevant: true },
          { name: 'Accuracy', value: inputData.param5, unit: 'μm', relevant: true }
        ];
      case "Bearing Assembly":
        return [
          { name: 'Temperature', value: inputData.param1, unit: 'K', relevant: true },
          { name: 'Vibration', value: inputData.param2, unit: 'Hz', relevant: true },
          { name: 'Load Capacity', value: inputData.param3, unit: 'N', relevant: true },
          { name: 'Speed', value: inputData.param4, unit: 'rpm', relevant: true },
          { name: 'Lubrication Level', value: inputData.param5, unit: '%', relevant: true }
        ];
      case "Cooling Lubrication":
        return [
          { name: 'Coolant Flow', value: inputData.param1, unit: 'L/min', relevant: true },
          { name: 'Temperature', value: inputData.param2, unit: 'K', relevant: true },
          { name: 'Pressure', value: inputData.param3, unit: 'bar', relevant: true },
          { name: 'Level', value: inputData.param4, unit: '%', relevant: true },
          { name: 'Purity', value: inputData.param5, unit: '%', relevant: true }
        ];
      case "Tool Holder Chuck":
        return [
          { name: 'Clamping Force', value: inputData.param1, unit: 'N', relevant: true },
          { name: 'Runout', value: inputData.param2, unit: 'μm', relevant: true },
          { name: 'Temperature', value: inputData.param3, unit: 'K', relevant: true },
          { name: 'Vibration', value: inputData.param4, unit: 'Hz', relevant: true },
          { name: 'Wear', value: inputData.param5, unit: '%', relevant: true }
        ];
      default:
        return [
          { name: 'Speed', value: inputData.param1, unit: 'rpm', relevant: true },
          { name: 'Torque', value: inputData.param2, unit: 'Nm', relevant: true },
          { name: 'Temperature', value: inputData.param3, unit: 'K', relevant: true },
          { name: 'Process Temp', value: inputData.param4, unit: 'K', relevant: true },
          { name: 'Tool Wear', value: inputData.param5, unit: 'min', relevant: true }
        ];
    }
  };

  const paramData = getComponentParameters();

  // Get maintenance tasks with proper names
  const maintData = [
    { name: params.maints[0] || 'Lubrication', count: inputData.maint1 },
    { name: params.maints[1] || 'Inspection', count: inputData.maint2 },
    { name: params.maints[2] || 'Calibration', count: inputData.maint3 },
    { name: params.maints[3] || 'Cleaning', count: inputData.maint4 }
  ];

  const probPercentage = result.probability * 100;
  const pieData = [
    { name: 'Risk', value: probPercentage },
    { name: 'Safe', value: 100 - probPercentage }
  ];
  
  const COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="charts-grid">
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{component} - Parameter Distribution</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paramData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 12}} 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
                        <p style={{ margin: 0 }}>Value: {payload[0].value} {payload[0].unit}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                fill="var(--primary)" 
                radius={[4, 4, 0, 0]}
                label={({ position, x, y, width, value }) => (
                  <text 
                    x={x + width / 2} 
                    y={y - 5} 
                    fill="#666" 
                    textAnchor="middle" 
                    fontSize={12}
                  >
                    {value}
                  </text>
                )}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Overall Risk Probability</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Maintenance Profile</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={maintData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 10}} 
                angle={-30}
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{r: 5}} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
