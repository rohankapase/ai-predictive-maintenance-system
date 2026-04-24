import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ResultCard = ({ result }) => {
  const isFailure = result.prediction === 1 || result.prediction === 'Fault';
  const color = isFailure ? 'var(--danger)' : 'var(--success)';
  const Icon = isFailure ? AlertCircle : CheckCircle;

  return (
    <div className="card glass-panel" style={{ 
      borderLeft: `8px solid ${color}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      marginBottom: '1.5rem', padding: '2rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start', width: '100%', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '2rem' }}>
            <Icon color={color} size={36} />
            {isFailure ? 'Fault Detected' : 'System Healthy'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              Risk Level: <span className={`badge badge-${result.risk_level.toLowerCase()}`}>{result.risk_level}</span>
            </p>
          </div>
          
          {result.faulty_components && result.faulty_components[0] !== "None → System Healthy" && (
             <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%' }}>
               <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Detected Faults:</h4>
               <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                 {result.faulty_components.map((err, i) => (
                   <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: '600', marginBottom: '0.4rem' }}>
                     <span style={{ 
                       backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                       color: 'var(--danger)', 
                       padding: '0.2rem 0.6rem', 
                       borderRadius: '4px',
                       border: '1px solid rgba(239, 68, 68, 0.3)',
                       boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)'
                     }}>
                       {err}
                     </span>
                   </li>
                 ))}
               </ul>
             </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'left', width: '100%', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Failure Probability</p>
        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: color }}>
          {(result.probability * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default ResultCard;
