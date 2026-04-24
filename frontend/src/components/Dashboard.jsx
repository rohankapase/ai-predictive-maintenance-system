import React from 'react';
import ResultCard from './ResultCard';
import Charts from './Charts';
import { Target, AlertOctagon, Link, Wrench, Activity } from 'lucide-react';
import { MILLING_MACHINE_PARAMS } from './InputForm';

const Dashboard = ({ result, inputData, history }) => {
  const getComponentParams = (component) => {
    return MILLING_MACHINE_PARAMS[component] || MILLING_MACHINE_PARAMS["Spindle Unit"];
  };

  const getParamDisplayName = (param, index, component = null) => {
    const targetComponent = component || result?.component || "Spindle Unit";
    const params = getComponentParams(targetComponent);
    return params.parameters[index] || param;
  };

  const getImageFilename = (component) => {
    const componentLower = (component || "spindle_unit").toLowerCase();
    
    // Special mappings for components with different file names
    const nameMap = {
      'tool holder chuck': 'tool_holder_chuck',
      'motor drive system': 'motor_drive_system',
      'spindle unit': 'spindle_unit',
      'bearing assembly': 'bearing_assembly',
      'cooling lubrication': 'cooling_lubrication',
      'cutting tool': 'cutting_tool',
      'feed mechanism': 'feed_mechanism'
    };
    
    // Use .jpeg for motor_drive_system and tool_holder_chuck, .jpg for others
    const baseName = nameMap[componentLower] || componentLower.replace(' ', '_');
    const useJpeg = ['motor_drive_system', 'tool_holder_chuck'].includes(baseName);
    return `${baseName}.${useJpeg ? 'jpeg' : 'jpg'}`;
  };

  return (
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.5s ease-in-out', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Component Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div className="component-hero-card">
          <img 
            src={`/images/${getImageFilename(result.component)}`}
            alt={result.component || "Component"}
            style={{ 
              width: '600px', 
              height: '400px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              objectFit: 'cover'
            }}
          />
        </div>
        <h2 style={{ marginTop: '1rem', fontSize: '2.2rem', fontWeight: '700', textTransform: 'capitalize', textShadow: '0 2px 10px rgba(0,0,0,0.3)', color: 'var(--text-main)', textAlign: 'center' }}>
          {result.component || "Unknown Component"}
        </h2>
      </div>

      {/* 2. Fault Summary */}
      <ResultCard result={result} />
      
      {/* 3 & 4. Maintenance and Dependency */}
      <div className="dashboard-grid">
        <div className="card">
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
             <Target size={18} color="var(--primary)" /> Identified Root Causes
           </h3>
           {result.root_causes.length > 0 ? (
             <ul className="result-list">
               {result.root_causes.map((cause, idx) => <li key={idx}>• {cause}</li>)}
             </ul>
           ) : (
             <p style={{ color: 'var(--text-muted)' }}>No major root causes identified.</p>
           )}
        </div>

        <div className="card" style={{ border: '1px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger)' }}>
             <AlertOctagon size={18} color="var(--danger)" /> Faulty Components
           </h3>
           {result.faulty_components && result.faulty_components.length > 0 && result.faulty_components[0] !== "None → System Healthy" ? (
             <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
               {result.faulty_components.map((part, idx) => (
                 <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                   <span style={{ 
                     backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                     color: 'var(--danger)', 
                     padding: '0.4rem 0.8rem', 
                     borderRadius: '6px',
                     fontWeight: '600',
                     border: '1px solid rgba(239, 68, 68, 0.3)',
                     boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
                   }}>
                     {part}
                   </span>
                   {/* Show parameters for faulty components */}
                   <div style={{ marginLeft: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                     <strong>Parameters:</strong>
                     <div style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                       <div>{getParamDisplayName('Parameter 1', 0, part)}: {inputData.param1}</div>
                       <div>{getParamDisplayName('Parameter 2', 1, part)}: {inputData.param2}</div>
                       <div>{getParamDisplayName('Parameter 3', 2, part)}: {inputData.param3}</div>
                       <div>{getParamDisplayName('Parameter 4', 3, part)}: {inputData.param4}</div>
                       <div>{getParamDisplayName('Parameter 5', 4, part)}: {inputData.param5}</div>
                     </div>
                   </div>
                 </li>
               ))}
             </ul>
           ) : (
             <p style={{ color: 'var(--success)', fontWeight: '600' }}>All components function optimally.</p>
           )}
        </div>

        <div className="card" style={{ border: '1px solid var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--warning)' }}>
             <Wrench size={18} color="var(--warning)" /> Recommended Actions
           </h3>
           <ul style={{ listStyleType: 'disc', paddingLeft: '1.2rem', color: 'var(--text-main)', fontWeight: '500' }}>
             {result.recommended_actions && result.recommended_actions.length > 0 && result.recommended_actions[0] !== "Continue standard operating procedures." ? (
               result.recommended_actions.map((act, idx) => <li key={idx} style={{ marginBottom: '0.4rem' }}>{act}</li>)
             ) : (
               <li>Continue standard operating procedures.</li>
             )}
           </ul>
        </div>

        <div className="card glass-panel" style={{ borderLeft: '4px solid var(--danger)', gridColumn: '1 / -1' }}>
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--danger)' }}>
             <Activity size={18} /> Root Cause Dependency Chain
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {result.failure_chains && result.failure_chains.length > 0 && result.failure_chains[0] !== "No critical cascade detected." ? (
               result.failure_chains.map((chain, chainIdx) => (
                 <div key={chainIdx} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                   {chain.split('→').map((step, idx, arr) => (
                     <React.Fragment key={idx}>
                       <div style={{ 
                         backgroundColor: idx === arr.length - 1 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-main)', 
                         color: idx === arr.length - 1 ? 'var(--danger)' : 'var(--text-main)',
                         padding: '0.4rem 0.8rem', 
                         borderRadius: '9999px',
                         border: idx === arr.length - 1 ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                         fontWeight: '500',
                         fontSize: '0.85rem',
                         whiteSpace: 'nowrap',
                         boxShadow: 'var(--shadow-sm)'
                       }}>
                         {step.trim()}
                       </div>
                       {idx < arr.length - 1 && (
                         <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>➜</div>
                       )}
                     </React.Fragment>
                   ))}
                 </div>
               ))
             ) : (
               <p style={{ color: 'var(--text-muted)' }}>No critical cascade detected.</p>
             )}
           </div>
        </div>
      </div>

      <Charts result={result} inputData={inputData} />

      {history && history.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} /> Prediction History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-lighter)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <img 
                  src={`/images/${getImageFilename(item.component)}`}
                  alt={item.component || "Component"}
                  className="history-component-image"
                  style={{ 
                    width: '90px', 
                    height: '70px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{item.component || "Unknown Component"}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: (item.prediction === 1 || item.prediction === 'Fault' || (item.faulty_components && item.faulty_components[0] !== "None → System Healthy")) ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', color: (item.prediction === 1 || item.prediction === 'Fault' || (item.faulty_components && item.faulty_components[0] !== "None → System Healthy")) ? 'var(--danger)' : 'var(--success)' }}>
                      Result: {(item.prediction === 1 || item.prediction === 'Fault' || (item.faulty_components && item.faulty_components[0] !== "None → System Healthy")) ? "Fault Detected" : "No Fault"}
                    </span>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      {item.component}: {(() => {
                        const params = getComponentParams(item.component);
                        return `${getParamDisplayName('Parameter 1', 0, item.component)}: ${item.inputData?.param1 || 'N/A'} | ${getParamDisplayName('Parameter 2', 1, item.component)}: ${item.inputData?.param2 || 'N/A'} | ${getParamDisplayName('Parameter 3', 2, item.component)}: ${item.inputData?.param3 || 'N/A'} | ${getParamDisplayName('Parameter 4', 3, item.component)}: ${item.inputData?.param4 || 'N/A'} | ${getParamDisplayName('Parameter 5', 4, item.component)}: ${item.inputData?.param5 || 'N/A'}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
