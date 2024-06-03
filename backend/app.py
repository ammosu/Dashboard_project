# fastapi_app.py
import os
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_excel(os.getenv('EXCEL'), index_col=0)
df['evaluation_results'] = df['evaluation_results'].str[:-1].astype(float)

@app.get("/data")
async def get_data(
    evaluation_method: str = Query(None),
    age: Union[float, None] = Query(None),
    training_period: Union[int, None] = Query(None),
    counties: List[str] = Query(None)
):
    filtered_df = df.copy()
    print(f"Received filters - Evaluation Method: {evaluation_method}, Age: {age}, Training Period: {training_period}, Counties: {counties}")

    # 檢查和應用過濾條件
    if evaluation_method:
        print(f"Filtering by evaluation_method: {evaluation_method}")
        filtered_df = filtered_df[filtered_df['evaluation_method'] == evaluation_method]
    if age is not None:
        print(f"Filtering by age: {age}")
        filtered_df = filtered_df[filtered_df['AGE'] == age]
    if training_period is not None:
        print(f"Filtering by training_period: {training_period}")
        filtered_df = filtered_df[filtered_df['last_training_period_time'] == training_period]
    if counties:
        print(f"Filtering by counties: {counties}")
        filtered_df = filtered_df[filtered_df['county'].isin(counties)]

    print("Filtered Data:")
    print(filtered_df)  # 用於調試

    return filtered_df.to_dict(orient="records")

@app.get("/filters")
async def get_filters():
    filters = {
        "evaluation_methods": df['evaluation_method'].unique().tolist(),
        "ages": df['AGE'].unique().tolist(),
        "training_periods": df['last_training_period_time'].unique().tolist(),
        "counties": df['county'].unique().tolist()
    }
    return filters

@app.get("/color-config")
async def get_color_config():
    return {
        os.getenv('REACT_APP_MODEL_1_NAME'): os.getenv('REACT_APP_MODEL_1_COLOR'),
        os.getenv('REACT_APP_MODEL_2_NAME'): os.getenv('REACT_APP_MODEL_2_COLOR')
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

