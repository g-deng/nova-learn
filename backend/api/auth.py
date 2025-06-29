from fastapi import Depends, HTTPException, status, Request
import firebase_admin
from firebase_admin import auth, credentials
from db import crud

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")
    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = crud.get_user_by_firebase_uid(request.state.db, uid)
        if not user:
            user = crud.create_user(request.state.db, uid, decoded_token.get("name", ""))
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")