import React, { useState } from 'react';
import { predictFailure } from '../api';
import { Wrench, AlertTriangle, Info } from 'lucide-react';

export const MILLING_MACHINE_PARAMS = {
  "Spindle Unit": {
    parameters: ["Rotational Speed [rpm]", "Torque [Nm]", "Temperature [K]", "Vibration [Hz]", "Power Consumption [kW]"],
    maints: ["Check Bearing Lubrication", "Inspect Belt Tension", "Verify Speed Calibration", "Clean Cooling Fins"]
  },
  "Cutting Tool": {
    parameters: ["Tool Wear [min]", "Cutting Force [N]", "Temperature [K]", "Vibration [Hz]", "Feed Rate [mm/min]"],
    maints: ["Replace Tool", "Clean Tool Holder", "Check Tool Alignment", "Inspect Cutting Edges"]
  },
  "Motor Drive System": {
    parameters: ["Motor Current [A]", "Power Output [kW]", "Temperature [K]", "Load Factor [%]", "Efficiency [%]"],
    maints: ["Check Motor Windings", "Inspect Drive Belts", "Test Power Supply", "Clean Motor Housing"]
  },
  "Feed Mechanism": {
    parameters: ["Feed Rate [mm/min]", "Axis Position [mm]", "Load Current [A]", "Backlash [mm]", "Accuracy [μm]"],
    maints: ["Lubricate Ball Screws", "Check Linear Guides", "Calibrate Axes", "Inspect Servo Motors"]
  },
  "Bearing Assembly": {
    parameters: ["Temperature [K]", "Vibration [Hz]", "Load Capacity [N]", "Speed [rpm]", "Lubrication Level [%]"],
    maints: ["Replace Bearings", "Check Grease Level", "Inspect Seals", "Monitor Temperature"]
  },
  "Cooling Lubrication": {
    parameters: ["Coolant Flow [L/min]", "Temperature [K]", "Pressure [bar]", "Level [%]", "Purity [%]"],
    maints: ["Replace Coolant", "Clean Filters", "Check Pump Operation", "Inspect Hoses"]
  },
  "Tool Holder Chuck": {
    parameters: ["Clamping Force [N]", "Runout [μm]", "Temperature [K]", "Vibration [Hz]", "Wear [%]"],
    maints: ["Clean Chuck Jaws", "Check Clamping Pressure", "Inspect Taper", "Replace Worn Parts"]
  }
};

const MILLING_MACHINE_INFO = {
  "Spindle Unit": {
    function: "Rotates the cutting tool at required speed",
    importance: "Critical for cutting accuracy and surface finish"
  },
  "Cutting Tool": {
    function: "Performs actual material cutting operation",
    importance: "Directly affects part quality and tool life"
  },
  "Motor Drive System": {
    function: "Provides power to drive spindle and feed mechanisms",
    importance: "Essential for machine operation and performance"
  },
  "Feed Mechanism": {
    function: "Controls tool movement and positioning",
    importance: "Determines dimensional accuracy and repeatability"
  },
  "Bearing Assembly": {
    function: "Supports rotating components with minimal friction",
    importance: "Critical for precision and longevity"
  },
  "Cooling Lubrication": {
    function: "Maintains optimal temperature and reduces friction",
    importance: "Prevents overheating and extends tool life"
  },
  "Tool Holder Chuck": {
    function: "Secures cutting tool and maintains precision",
    importance: "Ensures tool stability and cutting accuracy"
  }
};


const InputForm = ({ onPredict, disabled }) => {
  const [formData, setFormData] = useState({
    component: 'Spindle Unit',
    age: 0,
    param1: 1500,  // Speed (rpm)
    param2: 40,    // Torque (Nm)
    param3: 298,   // Temperature (K)
    param4: 308,   // Process Temp (K)
    param5: 50,    // Tool Wear (min)
    maint1: 0,
    maint2: 0,
    maint3: 0,
    maint4: 0
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: name === 'component' ? value : Number(value) };
      
      // Update defaults when component changes
      if (name === 'component') {
        updateComponentDefaults(value);
      }
      
      return newData;
    });
  };

// Component-specific default values
const COMPONENT_DEFAULTS = {
  'Spindle Unit': { param1: 1500, param2: 40, param3: 298, param4: 308, param5: 50 },
  'Cutting Tool': { param1: 1200, param2: 30, param3: 298, param4: 308, param5: 120 },
  'Motor Drive System': { param1: 1800, param2: 50, param3: 298, param4: 308, param5: 25 },
  'Feed Mechanism': { param1: 1000, param2: 35, param3: 298, param4: 308, param5: 40 },
  'Bearing Assembly': { param1: 2000, param2: 45, param3: 298, param4: 308, param5: 30 },
  'Cooling Lubrication': { param1: 1500, param2: 25, param3: 298, param4: 308, param5: 20 },
  'Tool Holder Chuck': { param1: 1800, param2: 35, param3: 298, param4: 308, param5: 15 }
};

// Update default values when component changes
const updateComponentDefaults = (component) => {
  const defaults = COMPONENT_DEFAULTS[component] || COMPONENT_DEFAULTS['Spindle Unit'];
  setFormData(prev => ({
    ...prev,
    component,
    param1: defaults.param1,
    param2: defaults.param2,
    param3: defaults.param3,
    param4: defaults.param4,
    param5: defaults.param5
  }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await predictFailure(formData);
      onPredict(result, formData);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during prediction.');
    } finally {
      setLoading(false);
    }
  };

  const selectedParams = MILLING_MACHINE_PARAMS[formData.component] || MILLING_MACHINE_PARAMS["Spindle Unit"];

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Milling Machine Component</label>
        <select name="component" value={formData.component} onChange={handleChange} className="form-input" required style={{ appearance: 'auto', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>
          <option value="Spindle Unit">Spindle Unit</option>
          <option value="Cutting Tool">Cutting Tool</option>
          <option value="Motor Drive System">Motor Drive System</option>
          <option value="Feed Mechanism">Feed Mechanism</option>
          <option value="Bearing Assembly">Bearing Assembly</option>
          <option value="Cooling Lubrication">Cooling Lubrication</option>
          <option value="Tool Holder Chuck">Tool Holder Chuck</option>
        </select>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-lighter)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          <Info size={16} /> Component Overview
        </h4>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.5rem' }}><strong>Function:</strong> {(MILLING_MACHINE_INFO[formData.component] || MILLING_MACHINE_INFO["Spindle Unit"]).function}</p>
          <p><strong>Importance:</strong> {(MILLING_MACHINE_INFO[formData.component] || MILLING_MACHINE_INFO["Spindle Unit"]).importance}</p>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Component Age (Years)</label>
        <input type="number" name="age" min="0" max="100" value={formData.age} onChange={handleChange} className="form-input" required />
      </div>

      <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
         <AlertTriangle size={16} /> Component Parameters
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[1, 2, 3, 4, 5].map((i, idx) => (
          <div className="form-group" key={`param${i}`}>
            <label className="form-label">{selectedParams.parameters[idx] || `Parameter ${i}`}</label>
            <input type="number" name={`param${i}`} min="0" value={formData[`param${i}`]} onChange={handleChange} className="form-input" required />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
         <Wrench size={16} /> Maintenance Records
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i, idx) => (
          <div className="form-group" key={`maint${i}`}>
            <label className="form-label">{selectedParams.maints[idx] || `Maint ${i}`}</label>
            <input type="number" name={`maint${i}`} min="0" value={formData[`maint${i}`]} onChange={handleChange} className="form-input" required />
          </div>
        ))}
      </div>

      {errorMsg && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem' }}>{errorMsg}</p>}

      <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem' }} disabled={loading || disabled}>
        {loading ? <div className="spinner"></div> : 'Generate Prediction'}
      </button>
    </form>
  );
};

export default InputForm;
