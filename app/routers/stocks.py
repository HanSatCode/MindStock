from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StockModel
from app.classes.stock_repository import StockRepository
from app.core import connection_manager, simulation_engine
import random

router = APIRouter()

INITIAL_STOCKS = [
    {"name": "대파뱅크",  "ticker": "DPB", "sector": "금융",  "price": 50000, "current_shares": 500,    "max_shares": 1000,  "trade_vat": 0.01, "ownership_vat": 0.01},
    {"name": "민모푸드",  "ticker": "MMF", "sector": "식품",  "price": 35000, "current_shares": 1000,   "max_shares": 2000,  "trade_vat": 0.01, "ownership_vat": 0.01},
    {"name": "현우전자",  "ticker": "HWE", "sector": "IT",    "price": 20000, "current_shares": 2000,   "max_shares": 4000,  "trade_vat": 0.01, "ownership_vat": 0.01},
    {"name": "동현전기",  "ticker": "DHE", "sector": "에너지", "price": 10000, "current_shares": 5000,   "max_shares": 10000, "trade_vat": 0.05, "ownership_vat": 0.05},
    {"name": "페트리켐",  "ticker": "PTC", "sector": "화학",  "price": 7500,  "current_shares": 10000,  "max_shares": 20000, "trade_vat": 0.075, "ownership_vat": 0.075},
    {"name": "성종게임",  "ticker": "SJG", "sector": "게임",  "price": 5000,  "current_shares": 20000,  "max_shares": 40000, "trade_vat": 0.1,  "ownership_vat": 0.1},
    {"name": "미쿠제과",  "ticker": "MKC", "sector": "식품",  "price": 2000,  "current_shares": 50000,  "max_shares": 100000, "trade_vat": 0.15, "ownership_vat": 0.15},
    {"name": "테토건설",  "ticker": "TTC", "sector": "건설",  "price": 1000,  "current_shares": 100000, "max_shares": 200000, "trade_vat": 0.175, "ownership_vat": 0.175},
    {"name": "네루수산",  "ticker": "NRS", "sector": "수산",  "price": 500,   "current_shares": 200000, "max_shares": 400000, "trade_vat": 0.2,  "ownership_vat": 0.2},
]

def init_stocks(db: Session):
    existing = db.query(StockModel).count()
    if existing == 0:
        for s in INITIAL_STOCKS:
            stock = StockModel(
                ticker = s["ticker"],
                name = s["name"],
                sector = s["sector"],
                current_price = s["price"],
                initial_price = s["price"],
                open_price = s["price"],
                current_shares = s["current_shares"],
                max_shares = s["max_shares"],
                trade_vat = s["trade_vat"],
                ownership_vat = s["ownership_vat"]
            )
            db.add(stock)
        db.commit()
        print("초기 종목 9개 생성 완료")

@router.get("/")
def get_stocks(db: Session = Depends(get_db)):
    stocks = StockRepository.find_all(db)
    return [
        {
            "ticker": s.get_ticker(),
            "name": s.get_name(),
            "sector": s.get_sector(),
            "current_price": s.get_current_price(),
            "initial_price": s.get_initial_price(),
            "open_price": s.get_open_price(),
            "ownership_vat": s.get_ownership_vat(),
            "change_rate": round((s.get_current_price() - s.get_open_price()) / s.get_open_price() * 100, 2)
        }
        for s in stocks
    ]

@router.get("/{ticker}/history")
def get_price_history(ticker: str, limit: int = 30):
    stock = next(
        (s for s in simulation_engine._SimulationEngine__stocks if s.get_ticker() == ticker),
        None
    )
    if not stock:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없음")
    history = stock.get_price_history()[-limit:]
    return [{"price": h.get_price(), "recorded_at": h.get_timestamp()} for h in history]

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.add_connection(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.remove_connection(websocket)