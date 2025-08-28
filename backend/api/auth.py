import time
from fastapi import Depends, HTTPException, status, Request
import firebase_admin
from firebase_admin import auth, credentials
from db import crud
from db.database import get_db
from sqlalchemy.orm import Session

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

async def get_current_user(request: Request, db: Session = Depends(get_db)):
    # print("Checking for current users")
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")
    id_token = auth_header.split(" ")[1]
    try:
        # print("Verifying ID token")
        # print(id_token)
        decoded_token = auth.verify_id_token(id_token)
        # print(decoded_token)
        uid = decoded_token.get("uid")
        # print(uid)
        if not uid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = crud.get_user_by_firebase_uid(db, uid)
        print("user found:", user)
        if not user:
            user = crud.create_user(db, uid, decoded_token.get("name", ""))
        return user
    except Exception as e:
        if "Token used too early" in str(e):
            print("DELAY FOR CLOCK SKEW")
            time.sleep(1)
            decoded_token = auth.verify_id_token(id_token)
        else:
            print(e)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")