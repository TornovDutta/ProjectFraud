from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "CyberSathi API"
    assert response.json()["emergency_helpline"] == "1930"

def test_emergency_endpoint():
    response = client.get("/api/v1/emergency/helpline-info")
    assert response.status_code == 200
    data = response.json()
    assert data["emergency_number"] == "1930"
    assert len(data["bank_helplines"]) > 0

def test_chat_and_complaint_flow():
    # 1. Start chat
    start_res = client.post("/api/v1/chat/start?language=English")
    assert start_res.status_code == 200
    start_data = start_res.json()
    complaint_id = start_data["complaint_id"]
    assert complaint_id.startswith("cmp_")
    
    # 2. Send message reporting fraud
    msg_payload = {
        "complaint_id": complaint_id,
        "message": "Someone called pretending to be SBI manager. I gave OTP and Rs 15000 was deducted via UPI. UTR is 987654321012.",
        "language": "English"
    }
    chat_res = client.post("/api/v1/chat/message", json=msg_payload)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["extracted_fields"]["fraud_amount"] == 15000.0
    assert chat_data["extracted_fields"]["transaction_id"] == "987654321012"
    
    # 3. Generate formal narrative
    gen_res = client.post(f"/api/v1/complaints/{complaint_id}/generate-narrative")
    assert gen_res.status_code == 200
    assert "FORMAL CYBERCRIME COMPLAINT PETITION" in gen_res.json()["narrative"]
    
    # 4. Check guided submission checklist
    guided_res = client.get(f"/api/v1/complaints/{complaint_id}/guided-submission")
    assert guided_res.status_code == 200
    assert len(guided_res.json()["checklist"]) == 5
    
    # 5. Authorized submission simulation
    auth_res = client.post(f"/api/v1/complaints/{complaint_id}/submit-authorized-api")
    assert auth_res.status_code == 200
    ack_no = auth_res.json()["acknowledgement_number"]
    assert ack_no is not None
    
    # 6. Tracking status verification
    track_res = client.get(f"/api/v1/tracking/status/{ack_no}")
    assert track_res.status_code == 200
    assert track_res.json()["found"] is True
    assert len(track_res.json()["timeline"]) >= 2
