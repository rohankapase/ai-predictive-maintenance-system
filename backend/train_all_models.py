import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os
import pickle
import sys

# Add the data directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'data'))

def train_component_models():
    """Train and save models for all milling machine components using AI4I2020 dataset"""
    
    # Dataset path
    dataset_path = r"C:\Users\rohan\Downloads\extracted_dataset\ai4i2020.csv"
    model_dir = os.path.join(os.path.dirname(__file__), 'model')
    
    print("=== Training Milling Machine Component Models ===")
    print(f"Dataset: {dataset_path}")
    print(f"Model Directory: {model_dir}")
    
    # Load dataset
    try:
        data = pd.read_csv(dataset_path)
        print(f"Dataset loaded successfully: {len(data)} rows")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return False
    
    # Create model directory if it doesn't exist
    os.makedirs(model_dir, exist_ok=True)
    
    # Calculate derived features
    data['temp_diff'] = data['Process temperature [K]'] - data['Air temperature [K]']
    data['power'] = (data['Rotational speed [rpm]'] * 2 * np.pi / 60) * data['Torque [Nm]']
    data['speed_torque_ratio'] = data['Rotational speed [rpm]'] / (data['Torque [Nm]'] + 1e-6)
    
    # Component configurations
    components = {
        'spindle_unit': {
            'features': ['Rotational speed [rpm]', 'Torque [Nm]', 'power'],
            'target': lambda df: ((df['TWF'] == 1) | 
                               (df['Rotational speed [rpm]'] < 1200) | 
                               (df['Rotational speed [rpm]'] > 1800)).astype(int),
            'name': 'Spindle Unit'
        },
        'cutting_tool': {
            'features': ['Tool wear [min]', 'Torque [Nm]', 'Rotational speed [rpm]'],
            'target': lambda df: (df['TWF'] == 1).astype(int),
            'name': 'Cutting Tool'
        },
        'motor_drive_system': {
            'features': ['Rotational speed [rpm]', 'Torque [Nm]', 'power'],
            'target': lambda df: (df['PWF'] == 1).astype(int),
            'name': 'Motor Drive System'
        },
        'feed_mechanism': {
            'features': ['Rotational speed [rpm]', 'Torque [Nm]', 'power'],
            'target': lambda df: (df['OSF'] == 1).astype(int),
            'name': 'Feed Mechanism'
        },
        'bearing_assembly': {
            'features': ['Rotational speed [rpm]', 'Torque [Nm]', 'temp_diff'],
            'target': lambda df: (df['HDF'] == 1).astype(int),
            'name': 'Bearing Assembly'
        },
        'cooling_lubrication': {
            'features': ['Air temperature [K]', 'Process temperature [K]', 'temp_diff'],
            'target': lambda df: ((df['HDF'] == 1) | (df['temp_diff'] > 15)).astype(int),
            'name': 'Cooling Lubrication'
        },
        'tool_holder_chuck': {
            'features': ['Rotational speed [rpm]', 'Torque [Nm]', 'power'],
            'target': lambda df: (df['RNF'] == 1).astype(int),
            'name': 'Tool Holder Chuck'
        }
    }
    
    trained_models = {}
    
    # Train model for each component
    for component_key, config in components.items():
        print(f"\n--- Training {config['name']} ---")
        
        try:
            # Prepare features and target
            features = config['features']
            X = data[features].copy()
            y = config['target'](data)
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Check if we have enough failure samples
            failure_count = y.sum()
            total_count = len(y)
            print(f"Failure samples: {failure_count}/{total_count} ({failure_count/total_count*100:.2f}%)")
            
            if failure_count < 10:
                print(f"Warning: Very few failure samples for {component_key}. Using synthetic balancing.")
                # Create some synthetic failure samples for training
                failure_indices = y[y == 1].index
                if len(failure_indices) > 0:
                    # Oversample failure cases
                    failure_samples = X.loc[failure_indices]
                    synthetic_failures = pd.concat([failure_samples] * (20 // len(failure_samples) + 1))
                    X_balanced = pd.concat([X, synthetic_failures])
                    y_balanced = pd.concat([y, pd.Series([1] * len(synthetic_failures))])
                else:
                    # Create synthetic failures based on thresholds
                    synthetic_failures = X.copy()
                    if 'Rotational speed [rpm]' in features:
                        synthetic_failures['Rotational speed [rpm]'] *= 1.5
                    if 'Torque [Nm]' in features:
                        synthetic_failures['Torque [Nm]'] *= 1.5
                    if 'Tool wear [min]' in features:
                        synthetic_failures['Tool wear [min]'] = 250
                    X_balanced = pd.concat([X, synthetic_failures])
                    y_balanced = pd.concat([y, pd.Series([1] * len(synthetic_failures))])
            else:
                X_balanced = X
                y_balanced = y
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_balanced, y_balanced, test_size=0.2, random_state=42, stratify=y_balanced
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train Random Forest
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                class_weight='balanced'
            )
            
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            train_score = model.score(X_train_scaled, y_train)
            test_score = model.score(X_test_scaled, y_test)
            
            print(f"Train Score: {train_score:.3f}, Test Score: {test_score:.3f}")
            
            # Save model
            model_data = {
                'model': model,
                'scaler': scaler,
                'feature_names': features,
                'component_name': config['name'],
                'component_key': component_key,
                'train_score': train_score,
                'test_score': test_score
            }
            
            model_path = os.path.join(model_dir, f"{component_key}_model.pkl")
            with open(model_path, 'wb') as f:
                pickle.dump(model_data, f)
            
            print(f"Model saved: {model_path}")
            trained_models[component_key] = model_path
            
        except Exception as e:
            print(f"Error training {component_key}: {e}")
            continue
    
    print(f"\n=== Training Complete ===")
    print(f"Successfully trained {len(trained_models)} component models:")
    for component, path in trained_models.items():
        print(f"  - {component}: {path}")
    
    return len(trained_models) == len(components)

def create_simple_predict_function():
    """Create a simple prediction function for testing"""
    
    predict_code = '''
import pickle
import os

def predict_component(component_name, input_data):
    """Simple prediction function for testing"""
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, f"{component_name}_model.pkl")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    
    model = model_data['model']
    scaler = model_data['scaler']
    feature_names = model_data['feature_names']
    
    # Prepare input
    input_df = pd.DataFrame([input_data])
    X = input_df[feature_names].fillna(0)
    
    # Scale and predict
    X_scaled = scaler.transform(X)
    prediction = model.predict(X_scaled)[0]
    probability = model.predict_proba(X_scaled)[0, 1]
    
    # Determine status
    if probability > 0.7:
        status = 'Failure Risk'
    elif probability > 0.4:
        status = 'Warning'
    else:
        status = 'Healthy'
    
    return {
        'component': component_name,
        'status': status,
        'probability': probability,
        'prediction': prediction,
        'feature_names': feature_names
    }
'''
    
    predict_path = os.path.join(os.path.dirname(__file__), 'model', 'simple_predict.py')
    with open(predict_path, 'w') as f:
        f.write(predict_code)
    
    print(f"Simple predict function created: {predict_path}")

if __name__ == "__main__":
    success = train_component_models()
    if success:
        create_simple_predict_function()
        print("\nAll models trained successfully!")
    else:
        print("\nSome models failed to train. Check the logs above.")
