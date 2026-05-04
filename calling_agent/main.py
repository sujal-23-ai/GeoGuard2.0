from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import uvicorn
import json

from caller import process_citizen_feedback

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

class SOSRequest(BaseModel):
    username: str
    latitude: float
    longitude: float
    emergency_contacts: List[str] = Field(..., min_length=1)

@app.get("/")
def read_root():
    return {"message": "GeoGuard Calling Agent is running."}

@app.post("/api/v1/sos_call")
async def handle_sos_call(request: SOSRequest):
    """
    Receives SOS data, calls the first emergency contact, and returns the call status.
    """
    try:
        input_data = request.dict()
        result = process_citizen_feedback(input_data)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
