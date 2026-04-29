import requests
import os
import time
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
BLAND_API_KEY = os.getenv("BLAND_API_KEY")

HEADERS = {
    "authorization": BLAND_API_KEY,
    "Content-Type": "application/json"
}

def initiate_emergency_call(username, phone_number, lat, long):
    """Initiates the emergency call using Bland AI and returns the call_id."""
    url = "https://api.bland.ai/v1/calls"

    message = f"The user {username} needs help and is in the {lat} and {long}. Please check your sms for the location. SOS SOS."
    
    task_prompt = (
        f"You are an automated emergency voice assistant.\n"
        f"Start by speaking immediately and say this message clearly:\n"
        f"'{message}'\n\n"
        f"Again speak"
        f"'{message}'\n\n"
        f"Again Speak\n"
        f"'{message}'\n\n"
        f"After repeating the message two times, politely hang up. Do not wait for a response."
    )

    payload = {
        "phone_number": phone_number,
        "task": task_prompt,
        "model": "enhanced",
        "voice": "nat",
        "language": "en",
        "wait_for_greeting": False,
        "interruption_threshold": 200,
        "max_duration": 5,
        "temperature": 0.5,
        "record": True
    }

    print(f"Initiating emergency call to {phone_number}...")
    response = requests.post(url, json=payload, headers=HEADERS)

    if response.status_code == 200:
        return response.json().get("call_id")
    else:
        print(f"Failed to initiate call. Status Code: {response.status_code}")
        print(response.text)
        return None


def poll_and_get_results(call_id, max_attempts=30):
    """
    Polls the API until the call completes and returns the analysis dictionary.
    Includes a max_attempts safeguard for API safety.
    """
    url = f"https://api.bland.ai/v1/calls/{call_id}"
    attempts = 0

    print("Waiting for the call to finish...")

    while attempts < max_attempts:
        response = requests.get(url, headers=HEADERS)

        if response.status_code == 200:
            call_data = response.json()
            status = call_data.get("status")

            if status == "completed":
                analysis = call_data.get("analysis")

                if not analysis:
                    print("Call hung up! AI is currently generating the summary. Waiting 5 seconds...")
                    time.sleep(5)
                    continue

                print("Analysis retrieved successfully.")
                return {
                    "status": "completed",
                    "analysis": analysis
                }

            elif status in ["failed", "no-answer", "busy", "canceled"]:
                print(f"Call ended prematurely with status: {status}")
                return {
                    "status": status,
                    "analysis": None
                }
        else:
            print(f"Error checking call status: {response.status_code}")
            return {"error": "Failed to fetch call status"}

        attempts += 1
        time.sleep(10)

    return {"error": "Polling timed out waiting for call to complete."}


def process_citizen_feedback(input_data) -> dict:
    """
    Main handler function. Takes an input JSON string or dict containing the username,
    location (lat, long), and phone numbers of emergency contacts.
    Calls the first emergency contact.
    """
    if isinstance(input_data, str):
        try:
            input_data = json.loads(input_data)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON format."}

    username = input_data.get("username", input_data.get("name", "Unknown User"))
    lat = input_data.get("latitude", input_data.get("lat"))
    long = input_data.get("longitude", input_data.get("long"))
    contacts = input_data.get("emergency_contacts", [])

    if not contacts:
        return {"error": "Emergency contacts list is required."}
    
    first_contact = contacts[0]

    if not lat or not long:
        return {"error": "Location coordinates (latitude/longitude) are required."}

    # 1. Start the emergency call
    call_id = initiate_emergency_call(username, first_contact, lat, long)

    if not call_id:
        return {"error": "Failed to initiate call."}

    return {
        "status": "SOS call successfully initiated",
        "call_id": call_id,
        "contact_called": first_contact
    }


if __name__ == "__main__":
    # Example JSON input execution
    incoming_request_json = json.dumps({
        "username": "Sujal",
        "latitude": "26.8467",
        "longitude": "80.9462",
        "emergency_contacts": ["+919305607168", "+911234567890"]
    })

    # Run the emergency logic
    output_result = process_citizen_feedback(incoming_request_json)

    print("\n--- Final Returned Object ---")
    print(json.dumps(output_result, indent=4))
