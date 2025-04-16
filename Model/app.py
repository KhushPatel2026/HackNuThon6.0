from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd

app = FastAPI()

# Load pre-trained stacking model and scaler
stacking_model = joblib.load("stacking_model.pkl")
scaler = joblib.load("scaler.pkl")

# Define the transaction schema
class Transaction(BaseModel):
    step: int
    type: str
    amount: float
    nameOrig: str
    oldbalanceOrg: float
    newbalanceOrig: float
    nameDest: str
    oldbalanceDest: float
    newbalanceDest: float

# Get feature names from the scaler
FEATURE_NAMES = scaler.feature_names_in_

# Preprocess transaction data
def preprocess_transaction(transaction: Transaction) -> pd.DataFrame:
    print("\n[DEBUG] Raw Transaction Input:", transaction.dict())

    # Feature engineering (same as in training)
    hour_of_day = transaction.step % 24
    log_amount = np.log1p(transaction.amount)
    log_balance_orig = np.log1p(transaction.oldbalanceOrg)
    log_balance_dest = np.log1p(transaction.oldbalanceDest)
    amount_ratio_orig = transaction.amount / (transaction.oldbalanceOrg + 1)
    amount_ratio_dest = transaction.amount / (transaction.oldbalanceDest + 1)

    # One-hot encoding for transaction type
    type_CASH_OUT = 1 if transaction.type == "CASH_OUT" else 0
    type_DEBIT = 1 if transaction.type == "DEBIT" else 0
    type_PAYMENT = 1 if transaction.type == "PAYMENT" else 0
    type_TRANSFER = 1 if transaction.type == "TRANSFER" else 0
    
    # Create dictionary with features in the exact same order as during training
    features = {
        "newbalanceOrig": transaction.newbalanceOrig,
        "newbalanceDest": transaction.newbalanceDest,
        "hour_of_day": hour_of_day,
        "log_amount": log_amount,
        "log_balance_orig": log_balance_orig,
        "log_balance_dest": log_balance_dest,
        "amount_ratio_orig": amount_ratio_orig,
        "amount_ratio_dest": amount_ratio_dest,
        "type_CASH_OUT": type_CASH_OUT,
        "type_DEBIT": type_DEBIT,
        "type_PAYMENT": type_PAYMENT,
        "type_TRANSFER": type_TRANSFER,
        "isFlaggedFraud": 0  # Default to 0 for prediction
    }
    
    # Create DataFrame with single row
    df = pd.DataFrame([features])
    
    # Ensure columns match exactly what scaler expects
    if set(df.columns) != set(FEATURE_NAMES):
        missing = set(FEATURE_NAMES) - set(df.columns)
        extra = set(df.columns) - set(FEATURE_NAMES)
        error_msg = f"Feature mismatch. Missing: {missing}, Extra: {extra}"
        print(f"[ERROR] {error_msg}")
        raise ValueError(error_msg)
    
    # Reorder columns to match scaler's expected order
    df = df[FEATURE_NAMES]
    
    print("\n[DEBUG] Generated Features Before Scaling:\n", df)
    return df

@app.post("/predict")
async def predict_fraud(transaction: Transaction):
    try:
        # Preprocess the transaction
        X_processed = preprocess_transaction(transaction)
        
        # Scale the features
        X_scaled = scaler.transform(X_processed)
        print("\n[DEBUG] Transformed Features After Scaling:\n", X_scaled)
        
        # Make prediction
        prediction = stacking_model.predict(X_scaled)
        probability = stacking_model.predict_proba(X_scaled)[0][1]
        
        print("\n[DEBUG] Model Prediction:", prediction[0])
        print("[DEBUG] Fraud Probability:", probability)

        return {
            "isFraud": bool(prediction[0]),
            "fraud_probability": float(probability),
            "transaction": transaction.dict()
        }
    except Exception as e:
        print("\n[ERROR] Exception Occurred:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}