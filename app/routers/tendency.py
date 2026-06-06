from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.classes.authorization import Authorization
from app.classes.player_repository import PlayerRepository

router = APIRouter()

@router.get("/")
def get_analysis(token: str = Query(...), db: Session = Depends(get_db)):
    name = Authorization.get_name_from_token(token)
    if not name:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")

    player = PlayerRepository.find_by_name(db, name)
    trade_history = player.get_trade_history()

    if len(trade_history) < 25:
        return {
            "message": f"거래 데이터가 부족합니다. 최소 25회 거래가 필요합니다. (현재 {len(trade_history)}회)",
            "investment_type": None
        }

    tendency = player.get_tendency()
    type_code = tendency.get_tendency_code()

    PlayerRepository.save_tendency(db, name, tendency)

    return {
        "investment_type": type_code,
        "trade_count": len(trade_history),
        "scores": {
            "risk": tendency.get_risk(),
            "duration": tendency.get_duration(),
            "concentration": tendency.get_concentration(),
            "profitability": tendency.get_profitability()
        },
        "stats": {
            "avg_duration_min": tendency.get_avg_duration(),
            "stock_count": tendency.get_stock_count(),
        }
    }
