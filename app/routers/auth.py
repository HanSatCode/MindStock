from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.classes.authorization import Authorization
from app.classes.player_repository import PlayerRepository

router = APIRouter()

class UserRegister(BaseModel):
    name: str
    password: str

class UserLogin(BaseModel):
    name: str
    password: str

@router.post("/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    if PlayerRepository.is_name_exists(db, data.name):
        raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임")

    player = PlayerRepository.create(db, data.name, data.password)
    token = Authorization.register(data.name, data.password)
    return {"access_token": token, "token_type": "bearer", "name": player.get_name()}

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    player = PlayerRepository.find_by_name(db, data.name)
    if not player:
        raise HTTPException(status_code=401, detail="닉네임 또는 비밀번호가 틀렸습니다")

    token = Authorization.login(data.name, data.password, player.get_password())
    if not token:
        raise HTTPException(status_code=401, detail="닉네임 또는 비밀번호가 틀렸습니다")

    return {"access_token": token, "token_type": "bearer", "name": player.get_name()}

@router.get("/me")
def get_me(token: str = Query(...), db: Session = Depends(get_db)):
    name = Authorization.get_name_from_token(token)
    if not name:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")

    player = PlayerRepository.find_by_name(db, name)
    if not player:
        raise HTTPException(status_code=401, detail="플레이어를 찾을 수 없음")

    return {
        "name": player.get_name(),
        "balance": player.get_portfolio().get_balance(),
    }

@router.get("/check-name")
def check_name(name: str, db: Session = Depends(get_db)):
    return {"available": not PlayerRepository.is_name_exists(db, name)}
