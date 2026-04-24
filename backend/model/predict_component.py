import pickle
import pandas as pd
import numpy as np
import os

def predict_component_failure(component_key, input_data, model_dir):
    """Predict failure for a specific component using trained model"""
    
    model_path = os.path.join(model_dir, f"{component_key}_model.pkl")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    try:
        # Load model data
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        model = model_data['model']
        scaler = model_data['scaler']
        feature_names = model_data['feature_names']
        component_name = model_data['component_name']
        
        # Prepare input data
        input_df = pd.DataFrame([input_data])
        
        # Add derived features if needed
        if component_key in ['spindle_unit', 'motor_drive_system', 'feed_mechanism', 'tool_holder_chuck']:
            if 'Rotational speed [rpm]' in input_df.columns and 'Torque [Nm]' in input_df.columns:
                input_df['power'] = (input_df['Rotational speed [rpm]'] * 2 * np.pi / 60) * input_df['Torque [Nm]']
        
        if component_key in ['bearing_assembly', 'cooling_lubrication']:
            if 'Process temperature [K]' in input_df.columns and 'Air temperature [K]' in input_df.columns:
                input_df['temp_diff'] = input_df['Process temperature [K]'] - input_df['Air temperature [K]']
        
        # Select and order features
        X = input_df[feature_names].fillna(0)
        
        # Scale and predict
        X_scaled = scaler.transform(X)
        prediction = model.predict(X_scaled)[0]
        probability = float(model.predict_proba(X_scaled)[0, 1])
        
        # Determine status
        if probability > 0.7:
            status = 'Failure Risk'
        elif probability > 0.4:
            status = 'Warning'
        else:
            status = 'Healthy'
        
        # Generate reasoning
        reasoning = generate_reasoning(component_key, input_data, probability)
        
        return {
            'component_key': component_key,
            'component_name': component_name,
            'status': status,
            'probability': probability,
            'prediction': int(prediction),
            'reasoning': reasoning,
            'feature_names': feature_names,
            'model_scores': {
                'train_score': model_data.get('train_score', 0),
                'test_score': model_data.get('test_score', 0)
            }
        }
        
    except Exception as e:
        raise Exception(f"Prediction failed for {component_key}: {str(e)}")

def generate_reasoning(component_key, input_data, probability):
    """Generate explainable reasoning for the prediction"""
    reasoning = []
    
    # Component-specific reasoning
    if component_key == 'spindle_unit':
        speed = input_data.get('Rotational speed [rpm]', 0)
        torque = input_data.get('Torque [Nm]', 0)
        
        if speed < 1200:
            reasoning.append(f"Low speed detected: {speed:.1f} rpm (below 1200 rpm)")
        elif speed > 1800:
            reasoning.append(f"High speed detected: {speed:.1f} rpm (above 1800 rpm)")
        
        if torque > 60:
            reasoning.append(f"High torque detected: {torque:.1f} Nm (above 60 Nm)")
    
    elif component_key == 'cutting_tool':
        wear = input_data.get('Tool wear [min]', 0)
        torque = input_data.get('Torque [Nm]', 0)
        
        if wear > 200:
            reasoning.append(f"Critical tool wear: {wear:.1f} min (above 200 min)")
        
        if torque > 60:
            reasoning.append(f"Elevated torque: {torque:.1f} Nm (indicating cutting resistance)")
    
    elif component_key == 'motor_drive_system':
        torque = input_data.get('Torque [Nm]', 0)
        
        if torque < 20:
            reasoning.append(f"Low torque: {torque:.1f} Nm (possible power loss)")
        elif torque > 60:
            reasoning.append(f"High torque: {torque:.1f} Nm (possible overload)")
    
    elif component_key == 'feed_mechanism':
        speed = input_data.get('Rotational speed [rpm]', 0)
        torque = input_data.get('Torque [Nm]', 0)
        
        if speed > 1700:
            reasoning.append(f"High feed speed: {speed:.1f} rpm (risk of overstrain)")
        
        if torque > 55:
            reasoning.append(f"High feed torque: {torque:.1f} Nm (mechanical stress)")
    
    elif component_key == 'bearing_assembly':
        speed = input_data.get('Rotational speed [rpm]', 0)
        temp_diff = input_data.get('Process temperature [K]', 0) - input_data.get('Air temperature [K]', 0)
        
        if speed > 2000:
            reasoning.append(f"Critical speed: {speed:.1f} rpm (bearing stress)")
        
        if temp_diff > 10:
            reasoning.append(f"Temperature rise: {temp_diff:.2f} K (heat dissipation issue)")
    
    elif component_key == 'cooling_lubrication':
        temp_diff = input_data.get('Process temperature [K]', 0) - input_data.get('Air temperature [K]', 0)
        
        if temp_diff > 15:
            reasoning.append(f"Critical temperature differential: {temp_diff:.2f} K (cooling failure)")
        elif temp_diff > 10:
            reasoning.append(f"Elevated temperature differential: {temp_diff:.2f} K (reduced cooling efficiency)")
    
    elif component_key == 'tool_holder_chuck':
        speed = input_data.get('Rotational speed [rpm]', 0)
        torque = input_data.get('Torque [Nm]', 0)
        
        if speed > 1800 and torque > 50:
            reasoning.append(f"High-speed, high-torque operation: {speed:.1f} rpm @ {torque:.1f} Nm (clamping stress)")
    
    # Add probability-based reasoning
    if probability > 0.7:
        reasoning.append("High failure probability detected - immediate inspection required")
    elif probability > 0.4:
        reasoning.append("Moderate risk detected - schedule maintenance soon")
    else:
        reasoning.append("Normal operating conditions detected")
    
    return reasoning if reasoning else ["All parameters within normal range"]

# Component failure chains for maintenance recommendations
COMPONENT_FAILURE_CHAINS = {
    "spindle_unit": "Speed Variance/Load Imbalance/Temperature Rise",
    "cutting_tool": "Tool Wear/Cutting Force/Vibration",
    "motor_drive_system": "Power Loss/Overload/Efficiency Drop", 
    "feed_mechanism": "Backlash/Axis Drift/Feed Instability",
    "bearing_assembly": "Lubrication Failure/Contamination/Fatigue",
    "cooling_lubrication": "Coolant Failure/Filter Clogging/Pump Failure",
    "tool_holder_chuck": "Clamping Failure/Runout/Taper Damage"
}

def get_maintenance_recommendations(component_key, status, reasoning):
    """Get maintenance recommendations based on component status and reasoning"""
    recommendations = []
    
    if status == 'Failure Risk':
        recommendations.append("IMMEDIATE INSPECTION REQUIRED")
        failure_chain = COMPONENT_FAILURE_CHAINS.get(component_key, "Unknown failure pattern")
        recommendations.append(f"Failure Chain: {failure_chain}")
    elif status == 'Warning':
        recommendations.append("Schedule maintenance within 24 hours")
    else:
        recommendations.append("Continue normal operation")
    
    # Specific recommendations based on reasoning
    for reason in reasoning:
        if 'speed' in reason.lower():
            recommendations.append("Check speed calibration and control system")
        elif 'torque' in reason.lower():
            recommendations.append("Inspect load conditions and mechanical components")
        elif 'temperature' in reason.lower():
            recommendations.append("Verify cooling system and temperature sensors")
        elif 'wear' in reason.lower():
            recommendations.append("Inspect and replace worn components")
        elif 'cooling' in reason.lower():
            recommendations.append("Check coolant flow and cooling system")
    
    # Remove duplicates while preserving order
    seen = set()
    unique_recommendations = []
    for rec in recommendations:
        if rec not in seen:
            unique_recommendations.append(rec)
            seen.add(rec)
    
    return unique_recommendations
