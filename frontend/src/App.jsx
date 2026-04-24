import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import Dashboard from './components/Dashboard';
import { Activity, Settings, AlertTriangle } from 'lucide-react';
import { trainModel } from './api';

function App() {
  const [predictionResult, setPredictionResult] = useState(null);
  const [inputData, setInputData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState('');

  useEffect(() => {
    const initializeModel = async () => {
      setIsTraining(true);
      try {
        await trainModel();
        setTrainingMessage('Model loaded and ready.');
      } catch (error) {
        console.error("Error initializing model:", error);
        setTrainingMessage('Warning: Could not initialize model automatically.');
      } finally {
        setIsTraining(false);
      }
    };
    initializeModel();
  }, []);

  const handlePredict = (result, data) => {
    setPredictionResult(result);
    // Store input data with the result to preserve specific values for this prediction
    setHistory(prev => [{ ...result, inputData: data, timestamp: new Date().toLocaleString() }, ...prev]);
    // Only set current input data for display (don't overwrite previous predictions)
    setInputData(data);
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          Milling Machine Predictive Maintenance
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Sub-component level failure prediction and diagnostics for Milling Machine systems
        </p>
        {isTraining && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--warning)', marginTop: '1rem' }}>
             <Settings size={18} className="spinner" style={{ borderColor: 'var(--warning)', borderTopColor: 'transparent' }}/>
             <span>Initializing AI Model...</span>
          </div>
        )}
      </header>

      <div className="app-layout">
        <aside>
          <div className="card glass-panel" style={{ position: 'sticky', top: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} />
              Component Parameters
            </h2>
            <InputForm onPredict={handlePredict} disabled={isTraining} />
          </div>
        </aside>
        
        <main>
          {predictionResult ? (
            <Dashboard result={predictionResult} inputData={inputData} history={history} />
          ) : (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '400px' }}>
               <img 
                 src="/images/milling_machine.jpg"
                 alt="Milling Machine"
                 style={{ 
                   width: '100%', 
                   maxWidth: '600px',
                   height: '350px',
                   borderRadius: '12px',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                   objectFit: 'cover',
                   marginBottom: '1.5rem'
                 }}
               />
               <AlertTriangle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
               <h2>No Data Analyzed</h2>
               <p>Enter the milling machine component parameters on the left to generate an AI prediction.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
