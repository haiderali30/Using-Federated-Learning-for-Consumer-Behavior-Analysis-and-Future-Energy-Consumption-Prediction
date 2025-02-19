# from flask import Flask, request, jsonify
# import pandas as pd
# import numpy as np
# from tensorflow.keras.layers import TFSMLayer
# from tensorflow.keras.models import Sequential
# import joblib
# from datetime import datetime, timedelta
# from flask_cors import CORS
# import logging

# logging.basicConfig(level=logging.DEBUG)

# app = Flask(__name__)
# CORS(app, resources={r"/predict": {"origins": "*"}})

# # Load the trained model and scaler
# model_path = "energy_consumption_model"
# model_layer = TFSMLayer(model_path, call_endpoint="serving_default")
# model = Sequential([model_layer])
# scaler = joblib.load("scaler.pkl")

# # Function to calculate future time features
# def get_future_time_features(hours_ahead):
#     current_time = datetime.now()
#     future_time = current_time + timedelta(hours=hours_ahead)
#     future_features = {
#         "Hour": future_time.hour,
#         "DayOfWeek": future_time.weekday(),
#         "Month": future_time.month,
#         "IsWeekend": int(future_time.weekday() in [5, 6]),
#         "IsHoliday": 0,
#     }
#     return future_features

# # Function to prepare input data
# def prepare_input_data(hours_ahead, user_inputs):
#     try:
#         future_time_features = get_future_time_features(hours_ahead)
#         input_data = {**future_time_features, **user_inputs}
#         input_df = pd.DataFrame([input_data])
#         features = ["Winter", "Spring", "Summer", "Fall", "Outdoor Temp (°C)", "Humidity (%)", "Cloud Cover (%)",
#                     "Occupancy", "Special Equipment [kW]", "Lighting [kW]", "HVAC [kW]", "Hour", "DayOfWeek", "Month", "IsWeekend", "IsHoliday"]
#         input_df = input_df[features]
#         input_df = scaler.transform(input_df)
#         return input_df
#     except Exception as e:
#         logging.error("Error preparing input data: %s", str(e))
#         raise

# # Function to make predictions
# def predict_consumption(model, input_df):
#     try:
#         prediction_dict = model.predict(input_df)
#         prediction_key = list(prediction_dict.keys())[0]
#         predicted_consumption = prediction_dict[prediction_key][0][0]
#         return predicted_consumption
#     except Exception as e:
#         logging.error("Error during prediction: %s", str(e))
#         raise

# # Add this function to calculate peak hours
# def get_peak_hours():
#     # Placeholder logic for peak hours
#     # You can replace this with actual logic to determine peak hours based on historical data
#     peak_hours = {
#         "Monday": [17, 18, 19],
#         "Tuesday": [17, 18, 19],
#         "Wednesday": [17, 18, 19],
#         "Thursday": [17, 18, 19],
#         "Friday": [17, 18, 19],
#         "Saturday": [11, 12, 13],
#         "Sunday": [11, 12, 13],
#     }
#     return peak_hours

# @app.route("/peak_hours", methods=["GET"])
# def peak_hours():
#     try:
#         peak_hours_data = get_peak_hours()
#         return jsonify(peak_hours_data)
#     except Exception as e:
#         app.logger.error(f"Error in /peak_hours endpoint: {e}")
#         return jsonify({"error": str(e)}), 400


# @app.route("/predict", methods=["POST"])
# def predict():
#     try:
#         data = request.json
#         hours_ahead = data["hours_ahead"]
#         user_inputs = data["user_inputs"]

#         # Prepare input data
#         input_df = prepare_input_data(hours_ahead, user_inputs)

#         # Make prediction
#         predicted_consumption = predict_consumption(model, input_df)

#         # Return prediction
#         return jsonify({"predicted_consumption": float(predicted_consumption)})
#     except Exception as e:
#         app.logger.error(f"Error in /predict endpoint: {e}")
#         return jsonify({"error": str(e)}), 400


# @app.route("/")
# def home():
#     return "Energy Consumption Prediction API is running!"

# if __name__ == "__main__":
#     # Change the port here to avoid conflict
#     app.run(debug=True, port=5001)  # Change port to 5001 (or any other port)


from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import joblib
from tensorflow.keras.models import load_model
from datetime import datetime, timedelta
from flask_cors import CORS
import logging

logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})

# Global constants (adjust as used during training)
SEQUENCE_LENGTH = 72  # e.g., past 72 hours
# File paths for model and scalers – update as needed:
MODEL_PATH = "prediction_model_files_docker/Using Federated Learning for Short-term Residential Load Forecasting.h5"
FEATURE_SCALER_PATH = "prediction_model_files_docker/Using Federated Learning for Short-term Residential Load Forecasting_feature.save"
TARGET_SCALER_PATH = "prediction_model_files_docker/Using Federated Learning for Short-term Residential Load Forecasting_target.save"
HISTORICAL_CSV_PATH = "prediction_model_files_docker/community_data.csv"  # CSV containing "Use [kW]" column

# Load the trained hybrid model and scalers
model = load_model(MODEL_PATH)
feature_scaler = joblib.load(FEATURE_SCALER_PATH)
target_scaler = joblib.load(TARGET_SCALER_PATH)

def get_historical_sequence(csv_path, sequence_length, target_scaler):
    """
    Load historical consumption data from a CSV file, extract the "Use [kW]" column,
    take the last 'sequence_length' values, scale them using target_scaler,
    and reshape to (1, sequence_length, 1).
    """
    df = pd.read_csv(csv_path)
    if "Use [kW]" not in df.columns:
        raise ValueError("CSV file must contain 'Use [kW]' column.")
    consumption = df["Use [kW]"].values  # shape: (n,)
    if len(consumption) < sequence_length:
        raise ValueError(f"Not enough historical data. Required: {sequence_length}, Found: {len(consumption)}")
    seq = consumption[-sequence_length:]
    seq = seq.reshape(-1, 1)
    seq_scaled = target_scaler.transform(seq)
    return np.expand_dims(seq_scaled, axis=0)  # shape: (1, sequence_length, 1)

def iterative_forecast_backend(model, initial_sequence, exo_input, forecast_horizon):
    """
    Iteratively forecast consumption for 'forecast_horizon' steps ahead.
    At each step, predict the next consumption value using the current historical sequence and exogenous input,
    update the sequence by dropping the oldest value and appending the new prediction,
    and finally return the prediction of the final step.
    """
    current_sequence = initial_sequence.copy()  # shape: (1, SEQUENCE_LENGTH, 1)
    final_prediction = None
    for _ in range(forecast_horizon):
        # Hybrid model expects two inputs: [historical sequence, exogenous features]
        pred_scaled = model.predict([current_sequence, exo_input])
        final_prediction = pred_scaled  # save current prediction
        # Update sequence: remove oldest entry and append new prediction
        # pred_scaled is shape (1, 1); reshape it to (1, 1, 1) for concatenation
        pred_reshaped = np.expand_dims(pred_scaled, axis=1)  # shape: (1, 1, 1)
        current_sequence = np.concatenate([current_sequence[:, 1:, :], pred_reshaped], axis=1)
    return final_prediction

def get_exogenous_input_from_request(user_inputs):
    """
    Expecting user_inputs as a dict with keys (in the same order as during training):
      "Winter", "Spring", "Summer", "Fall",
      "Outdoor Temp (°C)", "Humidity (%)", "Cloud Cover (%)",
      "Occupancy", "Special Equipment [kW]", "Lighting [kW]", "HVAC [kW]"
    """
    feature_order = ["Winter", "Spring", "Summer", "Fall", 
                     "Outdoor Temp (°C)", "Humidity (%)", "Cloud Cover (%)",
                     "Occupancy", "Special Equipment [kW]", "Lighting [kW]", "HVAC [kW]"]
    try:
        values = [user_inputs[key] for key in feature_order]
    except KeyError as e:
        raise ValueError(f"Missing exogenous feature: {e}")
    return np.array(values).reshape(1, -1)  # shape: (1, 11)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        forecast_horizon = int(data["hours_ahead"])  # e.g., 5 hours ahead
        user_inputs = data["user_inputs"]  # exogenous features provided by the operator
        
        # Prepare exogenous input vector (shape: (1, 11)) and scale it
        exo_input = get_exogenous_input_from_request(user_inputs)
        exo_input_scaled = feature_scaler.transform(exo_input)
        
        # Retrieve the historical consumption sequence from CSV (shape: (1, SEQUENCE_LENGTH, 1))
        initial_sequence = get_historical_sequence(HISTORICAL_CSV_PATH, SEQUENCE_LENGTH, target_scaler)
        
        # Use iterative forecasting to get the prediction for the final forecast step.
        final_prediction_scaled = iterative_forecast_backend(model, initial_sequence, exo_input_scaled, forecast_horizon)
        
        # Inverse-transform the prediction to get the actual consumption value.
        final_prediction = target_scaler.inverse_transform(final_prediction_scaled)
        
        return jsonify({"predicted_consumption": float(final_prediction[0][0])})
    except Exception as e:
        app.logger.error(f"Error in /predict endpoint: {e}")
        return jsonify({"error": str(e)}), 400

@app.route("/")
def home():
    return "Energy Consumption Prediction API is running!"

if __name__ == "__main__":
    app.run(debug=True, port=5001)
