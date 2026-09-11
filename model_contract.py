from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / 'Student Social Media And Mental Health Impact.csv'
TOP_COUNTRIES = ['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France']
FEATURE_COLUMNS = [
    'Age', 'Gender', 'Country', 'Academic_Level', 'Most_Used_Platform',
    'Purpose_Of_Use', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks', 'Study_Hours',
    'Physical_Activity_Hours', 'Sleep_Hours_Per_Night', 'Stress_Level',
    'Grouped_country',
]


def add_model_features(dataframe):
    """Apply the same cleaning and country grouping used during training and prediction."""
    result = dataframe.copy()
    result['Physical_Activity_Hours'] = result['Physical_Activity_Hours'].clip(lower=0)
    result['Grouped_country'] = result['Country'].where(result['Country'].isin(TOP_COUNTRIES), 'Other')
    return result


def load_training_data():
    return add_model_features(pd.read_csv(DATA_PATH).drop_duplicates())


def make_prediction_row(data):
    return add_model_features(pd.DataFrame([data]))[FEATURE_COLUMNS]
