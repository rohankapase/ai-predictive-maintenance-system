import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os
import pickle

class AI4I2020DataProcessor:
    """
    Data processor for AI4I2020 dataset specifically for milling machine sub-components
    """
    
    def __init__(self, dataset_path):
        self.dataset_path = dataset_path
        self.data = None
        self.scaler = StandardScaler()
        self.model = None
        
        # Milling machine sub-component parameter mappings
        self.component_mappings = {
            'spindle_unit': {
                'features': ['Rotational speed [rpm]', 'Torque [Nm]'],
                'target_indicators': ['TWF'],  # Tool Wear Failure affects spindle
                'thresholds': {
                    'speed_low': 1200,
                    'speed_high': 1800,
                    'torque_high': 60
                }
            },
            'cutting_tool': {
                'features': ['Tool wear [min]', 'Torque [Nm]'],
                'target_indicators': ['TWF'],  # Tool Wear Failure
                'thresholds': {
                    'wear_critical': 200,
                    'torque_high': 60
                }
            },
            'motor_drive_system': {
                'features': ['Rotational speed [rpm]', 'Torque [Nm]'],
                'target_indicators': ['PWF'],  # Power Failure
                'thresholds': {
                    'speed_variance': 300,
                    'torque_low': 20
                }
            },
            'feed_mechanism': {
                'features': ['Rotational speed [rpm]', 'Torque [Nm]'],
                'target_indicators': ['OSF'],  # Overstrain Failure
                'thresholds': {
                    'speed_high': 1700,
                    'torque_high': 55
                }
            },
            'bearing_assembly': {
                'features': ['Rotational speed [rpm]', 'Torque [Nm]'],
                'target_indicators': ['HDF'],  # Heat Dissipation Failure
                'thresholds': {
                    'speed_critical': 2000,
                    'temperature_rise': 10
                }
            },
            'cooling_lubrication': {
                'features': ['Air temperature [K]', 'Process temperature [K]'],
                'target_indicators': ['HDF'],  # Heat Dissipation Failure
                'thresholds': {
                    'temp_diff_critical': 15
                }
            },
            'tool_holder_chuck': {
                'features': ['Rotational speed [rpm]', 'Torque [Nm]'],
                'target_indicators': ['RNF'],  # Random Failure
                'thresholds': {
                    'speed_torque_product': 100000
                }
            }
        }
    
    def load_data(self):
        """Load AI4I2020 dataset"""
        try:
            self.data = pd.read_csv(self.dataset_path)
            print(f"Loaded dataset with {len(self.data)} rows")
            return True
        except Exception as e:
            print(f"Error loading dataset: {e}")
            return False
    
    def preprocess_data(self):
        """Preprocess the dataset for component-level analysis"""
        if self.data is None:
            self.load_data()
        
        # Calculate derived features
        self.data['temp_diff'] = self.data['Process temperature [K]'] - self.data['Air temperature [K]']
        self.data['power'] = (self.data['Rotational speed [rpm]'] * 2 * np.pi / 60) * self.data['Torque [Nm]']
        self.data['speed_torque_ratio'] = self.data['Rotational speed [rpm]'] / (self.data['Torque [Nm]'] + 1e-6)
        
        # Create component-specific target variables
        self.data['spindle_failure'] = ((self.data['TWF'] == 1) | 
                                      (self.data['Rotational speed [rpm]'] < 1200) | 
                                      (self.data['Rotational speed [rpm]'] > 1800)).astype(int)
        
        self.data['cutting_tool_failure'] = (self.data['TWF'] == 1).astype(int)
        self.data['motor_failure'] = (self.data['PWF'] == 1).astype(int)
        self.data['feed_failure'] = (self.data['OSF'] == 1).astype(int)
        self.data['bearing_failure'] = (self.data['HDF'] == 1).astype(int)
        self.data['cooling_failure'] = ((self.data['HDF'] == 1) | 
                                     (self.data['temp_diff'] > 15)).astype(int)
        self.data['chuck_failure'] = (self.data['RNF'] == 1).astype(int)
        
        return self.data
    
    def prepare_component_data(self, component_name):
        """Prepare data for specific component"""
        if self.data is None:
            self.preprocess_data()
        
        component_config = self.component_mappings[component_name]
        features = component_config['features']
        target = f"{component_name}_failure"
        
        # Add derived features if relevant
        if component_name in ['spindle_unit', 'motor_drive_system']:
            features.append('power')
        if component_name == 'cooling_lubrication':
            features.append('temp_diff')
        
        X = self.data[features].copy()
        y = self.data[target]
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        return X, y
    
    def train_component_model(self, component_name):
        """Train model for specific component"""
        X, y = self.prepare_component_data(component_name)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
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
        
        print(f"{component_name} - Train Score: {train_score:.3f}, Test Score: {test_score:.3f}")
        
        return model, X.columns.tolist()
    
    def save_component_model(self, component_name, model, feature_names, model_dir):
        """Save trained component model"""
        os.makedirs(model_dir, exist_ok=True)
        
        model_data = {
            'model': model,
            'scaler': self.scaler,
            'feature_names': feature_names,
            'component_config': self.component_mappings[component_name]
        }
        
        model_path = os.path.join(model_dir, f"{component_name}_model.pkl")
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Saved {component_name} model to {model_path}")
        return model_path
    
    def train_all_components(self, model_dir):
        """Train models for all components"""
        if self.data is None:
            self.preprocess_data()
        
        trained_models = {}
        
        for component_name in self.component_mappings.keys():
            print(f"\nTraining model for {component_name}...")
            model, feature_names = self.train_component_model(component_name)
            model_path = self.save_component_model(component_name, model, feature_names, model_dir)
            trained_models[component_name] = model_path
        
        return trained_models
    
    def get_component_prediction(self, component_name, input_data, model_dir):
        """Get prediction for specific component"""
        model_path = os.path.join(model_dir, f"{component_name}_model.pkl")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model for {component_name} not found at {model_path}")
        
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        model = model_data['model']
        scaler = model_data['scaler']
        feature_names = model_data['feature_names']
        config = model_data['component_config']
        
        # Prepare input data
        input_df = pd.DataFrame([input_data])
        
        # Add derived features if needed
        if component_name in ['spindle_unit', 'motor_drive_system']:
            input_df['power'] = (input_df['Rotational speed [rpm]'] * 2 * np.pi / 60) * input_df['Torque [Nm]']
        if component_name == 'cooling_lubrication':
            input_df['temp_diff'] = input_df['Process temperature [K]'] - input_df['Air temperature [K]']
        
        # Select and order features
        X = input_df[feature_names].fillna(0)
        
        # Scale and predict
        X_scaled = scaler.transform(X)
        prediction = model.predict(X_scaled)[0]
        probability = model.predict_proba(X_scaled)[0, 1]  # Probability of failure
        
        # Determine status
        if probability > 0.7:
            status = 'Failure Risk'
        elif probability > 0.4:
            status = 'Warning'
        else:
            status = 'Healthy'
        
        # Generate reasoning
        reasoning = self._generate_reasoning(component_name, input_data, config, probability)
        
        return {
            'component': component_name,
            'status': status,
            'probability': probability,
            'prediction': prediction,
            'reasoning': reasoning,
            'config': config
        }
    
    def _generate_reasoning(self, component_name, input_data, config, probability):
        """Generate explainable reasoning for prediction"""
        reasoning = []
        thresholds = config['thresholds']
        
        if component_name == 'spindle_unit':
            speed = input_data.get('Rotational speed [rpm]', 0)
            torque = input_data.get('Torque [Nm]', 0)
            
            if speed < thresholds['speed_low']:
                reasoning.append(f"Low speed detected: {speed:.1f} rpm (below {thresholds['speed_low']} rpm)")
            elif speed > thresholds['speed_high']:
                reasoning.append(f"High speed detected: {speed:.1f} rpm (above {thresholds['speed_high']} rpm)")
            
            if torque > thresholds['torque_high']:
                reasoning.append(f"High torque detected: {torque:.1f} Nm (above {thresholds['torque_high']} Nm)")
        
        elif component_name == 'cutting_tool':
            wear = input_data.get('Tool wear [min]', 0)
            torque = input_data.get('Torque [Nm]', 0)
            
            if wear > thresholds['wear_critical']:
                reasoning.append(f"Critical tool wear: {wear:.1f} min (above {thresholds['wear_critical']} min)")
            
            if torque > thresholds['torque_high']:
                reasoning.append(f"Elevated torque: {torque:.1f} Nm (above {thresholds['torque_high']} Nm)")
        
        elif component_name == 'cooling_lubrication':
            temp_diff = input_data.get('Process temperature [K]', 0) - input_data.get('Air temperature [K]', 0)
            
            if temp_diff > thresholds['temp_diff_critical']:
                reasoning.append(f"Critical temperature differential: {temp_diff:.2f} K (above {thresholds['temp_diff_critical']} K)")
        
        # Add probability-based reasoning
        if probability > 0.7:
            reasoning.append("High failure probability detected - immediate inspection required")
        elif probability > 0.4:
            reasoning.append("Moderate risk detected - schedule maintenance soon")
        else:
            reasoning.append("Normal operating conditions detected")
        
        return reasoning if reasoning else ["All parameters within normal range"]
