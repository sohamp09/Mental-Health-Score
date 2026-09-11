"""Generate a factual PDF summary from the project's ML notebook pipeline."""
from pathlib import Path

import numpy as np
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler
from model_contract import FEATURE_COLUMNS, load_training_data

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / 'Student Social Media And Mental Health Impact.csv'
PDF_PATH = ROOT / 'Mental_Health_Signal_ML_Report.pdf'


def make_pipeline():
    skewed = ['Study_Hours']
    numeric = ['Age', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks', 'Physical_Activity_Hours', 'Sleep_Hours_Per_Night']
    ordinal = ['Stress_Level']
    nominal = ['Gender', 'Academic_Level', 'Most_Used_Platform', 'Purpose_Of_Use', 'Grouped_country']
    preprocessor = ColumnTransformer([
        ('skewed', Pipeline([('log', FunctionTransformer(np.log1p)), ('scale', StandardScaler())]), skewed),
        ('numeric', Pipeline([('scale', StandardScaler())]), numeric),
        ('ordinal', OneHotEncoder(categories=[['Low', 'Medium', 'High', 'Very High']]), ordinal),
        ('nominal', OneHotEncoder(handle_unknown='ignore'), nominal),
    ])
    return preprocessor, skewed + numeric + ordinal + nominal


def evaluate(model, x_train, x_test, y_train, y_test):
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    train_predictions = model.predict(x_train)
    return [r2_score(y_test, predictions), r2_score(y_train, train_predictions), mean_absolute_error(y_test, predictions), np.sqrt(mean_squared_error(y_test, predictions))]


def build_report():
    df = load_training_data()
    preprocessor, feature_columns = make_pipeline()
    x_train, x_test, y_train, y_test = train_test_split(df[FEATURE_COLUMNS], df['Mental_Health_Score'], test_size=.33, random_state=42)
    linear = Pipeline([('preprocessor', preprocessor), ('regressor', LinearRegression())])
    forest = Pipeline([('preprocessor', preprocessor), ('regressor', RandomForestRegressor(random_state=42))])
    linear_metrics = evaluate(linear, x_train, x_test, y_train, y_test)
    forest_metrics = evaluate(forest, x_train, x_test, y_train, y_test)
    search = RandomizedSearchCV(forest, {
        'regressor__n_estimators': [100, 200, 300],
        'regressor__max_depth': [5, 10, 15],
        'regressor__min_samples_split': [2, 5, 10],
        'regressor__min_samples_leaf': [1, 2, 4],
    }, n_iter=15, cv=5, scoring='r2', random_state=42, n_jobs=-1)
    tuned_metrics = evaluate(search, x_train, x_test, y_train, y_test)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='TitleCenter', parent=styles['Title'], alignment=TA_CENTER, textColor=colors.HexColor('#16483d'), spaceAfter=10))
    styles.add(ParagraphStyle(name='Section', parent=styles['Heading2'], textColor=colors.HexColor('#176b5a'), spaceBefore=14, spaceAfter=7))
    styles.add(ParagraphStyle(name='BodySmall', parent=styles['BodyText'], fontSize=9.5, leading=14, textColor=colors.HexColor('#344a45')))
    doc = SimpleDocTemplate(str(PDF_PATH), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm)
    story = [Paragraph('Mental Health Signal', styles['TitleCenter']), Paragraph('Machine Learning Information Report', styles['Heading2']), Spacer(1, 5)]
    story.append(Paragraph('Purpose', styles['Section']))
    story.append(Paragraph('This project estimates an informational Mental Health Score from student social-media habits, academic routine, lifestyle signals, and perceived stress. The output is a reflection tool, not a clinical assessment or diagnosis.', styles['BodySmall']))
    story.append(Paragraph('Dataset', styles['Section']))
    story.append(Paragraph(f'The source file contains {len(df):,} records and {len(df.columns)-1} input features plus the target Mental_Health_Score. Ages range from {df.Age.min():.0f} to {df.Age.max():.0f}; the average target score is {df.Mental_Health_Score.mean():.2f}/10. The target ranges from {df.Mental_Health_Score.min():.1f} to {df.Mental_Health_Score.max():.1f}. Duplicate rows were removed and negative physical-activity values were clipped to zero.', styles['BodySmall']))
    story.append(Paragraph('Features and preprocessing', styles['Section']))
    story.append(Paragraph('Study_Hours is log-transformed with log1p and scaled. Other numeric variables are standardized. Stress_Level is encoded with the ordered categories Low, Medium, High, and Very High. Gender, academic level, platform, purpose, and grouped country are one-hot encoded with unknown categories ignored. Countries outside the top ten are grouped as Other.', styles['BodySmall']))
    story.append(Paragraph('Evaluation', styles['Section']))
    table_data = [['Model', 'Test R²', 'Train R²', 'MAE', 'RMSE'], ['Linear Regression', *[f'{value:.3f}' for value in linear_metrics]], ['Random Forest', *[f'{value:.3f}' for value in forest_metrics]], ['Random Forest tuned', *[f'{value:.3f}' for value in tuned_metrics]]]
    table = Table(table_data, colWidths=[42*mm, 25*mm, 25*mm, 22*mm, 22*mm])
    table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.HexColor('#176b5a')), ('TEXTCOLOR', (0,0), (-1,0), colors.white), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#b9d5cc')), ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#eff7f3')), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 8.5), ('ALIGN', (1,1), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BOTTOMPADDING', (0,0), (-1,-1), 7), ('TOPPADDING', (0,0), (-1,-1), 7)]))
    story.append(table)
    story.append(Paragraph('Model used by the app', styles['Section']))
    story.append(Paragraph('The API loads Mental_Health_Model.pkl, a RandomForestRegressor pipeline with the preprocessing described above. The notebook also evaluates a tuned random forest using randomized search with 15 configurations and five-fold cross-validation. Metrics describe this dataset split and should not be treated as clinical validity evidence.', styles['BodySmall']))
    story.append(Paragraph('RAG use', styles['Section']))
    story.append(Paragraph('Signal Guide retrieves relevant passages from this report and the wellness knowledge base before asking Mistral to answer. Mistral is instructed to stay within retrieved context, avoid diagnosis, and recommend qualified human support for urgent concerns.', styles['BodySmall']))
    story.append(Paragraph('Limitations and safety', styles['Section']))
    story.append(Paragraph('The model reflects correlations in this dataset and can be wrong for an individual. It does not assess safety, symptoms, treatment, or emergencies. For urgent risk, contact local emergency services or a crisis line and reach a trusted person or qualified professional.', styles['BodySmall']))
    doc.build(story)
    print(f'Created {PDF_PATH}')


if __name__ == '__main__':
    build_report()
