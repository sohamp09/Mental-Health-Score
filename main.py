import joblib
import json
import os
import numpy as np
import pandas as pd
from urllib import error as url_error
from urllib import request as url_request
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from model_contract import DATA_PATH, FEATURE_COLUMNS, TOP_COUNTRIES, add_model_features, make_prediction_row
from rag_knowledge import retrieve_context
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

load_dotenv()

model = joblib.load(os.path.join(os.path.dirname(__file__), 'Mental_Health_Model.pkl'))


def evaluate_served_model():
    """Evaluate the exact model artifact used by /predict on a fixed holdout."""
    df = pd.read_csv(DATA_PATH).drop_duplicates()
    df = add_model_features(df)
    _, x_test, _, y_test = train_test_split(
        df[FEATURE_COLUMNS], df['Mental_Health_Score'], test_size=.33, random_state=42
    )
    predictions = model.predict(x_test)
    return {
        'r2': round(float(r2_score(y_test, predictions)), 4),
        'mae': round(float(mean_absolute_error(y_test, predictions)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_test, predictions))), 4),
        'test_rows': len(y_test),
        'test_size': 0.33,
    }


MODEL_METRICS = evaluate_served_model()

app = FastAPI()

allowed_origins = [origin.strip() for origin in os.getenv(
    'CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174'
).split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentData(BaseModel):
    age                     : int = Field(..., ge=10, le=100)
    gender                  : Literal['Male', 'Female']
    country                 : str
    academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24)
    daily_unlocks           : int   = Field(..., ge=0)
    study_hours             : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night   : float = Field(..., ge=0, le=24)
    stress_level            : Literal['Medium', 'Low', 'Very High', 'High']


class PredictionResponse(BaseModel):
    predicted_mental_health_score:float


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    answer: str
    source: str = "Signal Guide knowledge base + Mistral"


@app.get('/')
def greet():
    return {'Welcome to Mental Health Score Web App......'}


@app.get('/model-info')
def model_info():
    return {
        'model': 'RandomForestRegressor',
        'target': 'Mental_Health_Score',
        'metrics': MODEL_METRICS,
        'evaluated_at': '2026-09-11',
        'interpretation': 'R2 is regression goodness-of-fit; MAE and RMSE are average prediction errors on a 0-10 score scale.',
    }


@app.post('/chat', response_model=ChatResponse)
def chat(data: ChatRequest):
    api_key = os.getenv('MISTRAL_API_KEY')
    if not api_key:
        return ChatResponse(answer='Signal Guide is not configured yet. Add MISTRAL_API_KEY to the backend environment, then try again.')

    context = retrieve_context(data.message)
    fallback = (
        'Based on the project guidance:\n\n'
        + context.split('\n\n')[0].replace('[', '').replace(']', ': ', 1)
        + '\n\nThis is informational guidance, not a diagnosis or medical advice.'
    )
    prompt = (
        'You are Signal Guide, a careful wellness assistant for the Mental Health Signal website. '
        'Answer the user using only the grounded context below. Be concise, warm, and practical. '
        'Do not diagnose, predict emergencies, or invent facts. If the context does not answer the '
        'question, say you do not have enough information and suggest a qualified professional. '
        'For immediate safety concerns, advise local emergency services or a crisis line.\n\n'
        f'GROUNDED CONTEXT:\n{context}\n\nUSER QUESTION:\n{data.message}'
    )
    payload = json.dumps({
        'model': os.getenv('MISTRAL_MODEL', 'mistral-small-latest'),
        'messages': [
            {'role': 'system', 'content': 'You answer grounded wellness questions for a student check-in app.'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.2,
        'max_tokens': 220,
    }).encode('utf-8')
    request = url_request.Request(
        'https://api.mistral.ai/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with url_request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode('utf-8'))
        answer = result['choices'][0]['message']['content'].strip()
        return ChatResponse(answer=answer)
    except url_error.HTTPError as exc:
        print(f'Mistral chat error: HTTP {exc.code}')
        return ChatResponse(answer=fallback, source='Signal Guide local RAG fallback')
    except (url_error.URLError, KeyError, IndexError, json.JSONDecodeError) as exc:
        print(f'Mistral chat error: {type(exc).__name__}')
        return ChatResponse(answer=fallback, source='Signal Guide local RAG fallback')

@app.post('/predict', response_model=PredictionResponse)
def predict(data: StudentData):
   
    input_row = make_prediction_row({
        'Age'                       :data.age,
        'Gender'                    :data.gender,
        'Country'                   :data.country,
        'Academic_Level'            :data.academic_level,
        'Most_Used_Platform'        :data.most_used_platform,
        'Purpose_Of_Use'            :data.purpose_of_use,
        'Avg_Daily_Usage_Hours'     :data.avg_daily_usage_hours,
        'Daily_Unlocks'             :data.daily_unlocks,
        'Study_Hours'               :data.study_hours,
        'Physical_Activity_Hours'   :data.physical_activity_hours,
        'Sleep_Hours_Per_Night'     :data.sleep_hours_per_night,
        'Stress_Level'              :data.stress_level,
    })

    prediction = model.predict(input_row)[0]
    return PredictionResponse(predicted_mental_health_score=round(float(prediction), 2))