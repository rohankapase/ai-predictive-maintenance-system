from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model.predict_component import predict_component_failure, get_maintenance_recommendations, COMPONENT_FAILURE_CHAINS
import shutil
import pandas as pd

app = FastAPI(title="AI Predictive Maintenance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "model")
DATASET_PATH = r"C:\Users\rohan\Downloads\extracted_dataset\ai4i2020.csv"

class PredictRequest(BaseModel):
    component: str
    age: float
    param1: float
    param2: float
    param3: float
    param4: float
    param5: float
    maint1: float
    maint2: float
    maint3: float
    maint4: float

@app.get("/")
def home():
    return {"message": "API is running 🚀"}

@app.post("/train")
def train_model_endpoint():
    try:
        # Import the training function
        import train_all_models
        
        # Train all component models
        success = train_all_models.train_component_models()
        
        if success:
            # Load dataset info
            import pandas as pd
            data = pd.read_csv(DATASET_PATH)
            
            # List trained models
            import os
            model_files = [f for f in os.listdir(MODEL_DIR) if f.endswith('_model.pkl')]
            
            return {
                "message": "AI4I2020 models trained successfully for all milling machine components.", 
                "trained_components": [f.replace('_model.pkl', '') for f in model_files],
                "dataset_info": {
                    "total_samples": len(data),
                    "features": ["Air temperature [K]", "Process temperature [K]", "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"],
                    "failure_types": ["TWF", "HDF", "PWF", "OSF", "RNF"]
                },
                "model_files": model_files,
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Model training failed for some components")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/predict")
def predict_component_endpoint(request: PredictRequest):
    try:
        # Map component name to internal format
        component_mapping = {
            "Spindle Unit": "spindle_unit",
            "Cutting Tool": "cutting_tool", 
            "Motor Drive System": "motor_drive_system",
            "Feed Mechanism": "feed_mechanism",
            "Bearing Assembly": "bearing_assembly",
            "Cooling Lubrication": "cooling_lubrication",
            "Tool Holder Chuck": "tool_holder_chuck"
        }
        
        component_key = component_mapping.get(request.component, "spindle_unit")
        
        # Map input parameters to dataset features
        input_data = {
            "Rotational speed [rpm]": request.param1,
            "Torque [Nm]": request.param2,
            "Air temperature [K]": request.param3,
            "Process temperature [K]": request.param4,
            "Tool wear [min]": request.param5
        }
        
        # Get component prediction using trained model
        result = predict_component_failure(component_key, input_data, MODEL_DIR)
        
        # Generate maintenance recommendations
        recommended_actions = get_maintenance_recommendations(
            component_key, result['status'], result['reasoning']
        )
        
        # Generate failure chains
        failure_chains = []
        if result['status'] == 'Failure Risk':
            failure_chains.append(COMPONENT_FAILURE_CHAINS.get(component_key, "Unknown failure pattern"))
        else:
            failure_chains.append('No critical cascade detected')
        
        return {
            "component": request.component,
            "component_key": component_key,
            "prediction": result['prediction'],
            "probability": result['probability'],
            "status": result['status'],
            "faulty_components": [result['status']] if result['status'] != 'Healthy' else ['System Healthy'],
            "recommended_actions": recommended_actions,
            "failure_chains": failure_chains,
            "risk_level": result['status'].upper(),
            "root_causes": result['reasoning'],
            "faulty_parts": [request.component] if result['status'] != 'Healthy' else [],
            "solutions": result['reasoning'],
            "dataset_source": "AI4I2020",
            "model_info": {
                "feature_names": result['feature_names'],
                "model_scores": result['model_scores']
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
