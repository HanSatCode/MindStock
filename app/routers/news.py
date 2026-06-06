from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.classes.news_repository import NewsRepository
from app.classes.stock_repository import StockRepository
from datetime import datetime

router = APIRouter()

@router.get("/")
def get_news(db: Session = Depends(get_db)):
    news_list = NewsRepository.find_all(db)
    return [
        {
            "ticker": n.get_ticker(),
            "outlook": n.get_outlook(),
            "title": n.get_title(),
            "description": n.get_description(),
            "impact": n.get_impact(),
            "timestamp": n.get_timestamp(),
            "reveal_time": n.get_reveal_time(),
            "is_real": n.get_is_real() if n.get_reveal_time() and n.get_reveal_time() <= datetime.utcnow() else None
        }
        for n in news_list
    ]

@router.get("/{ticker}")
def get_news_by_ticker(ticker: str, db: Session = Depends(get_db)):
    stock = StockRepository.find_by_ticker(db, ticker)
    if not stock:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없음")

    news_list = NewsRepository.find_by_ticker(db, ticker)
    return [
        {
            "ticker": n.get_ticker(),
            "outlook": n.get_outlook(),
            "title": n.get_title(),
            "description": n.get_description(),
            "impact": n.get_impact(),
            "timestamp": n.get_timestamp(),
            "reveal_time": n.get_reveal_time(),
            "is_real": n.get_is_real() if n.get_reveal_time() and n.get_reveal_time() <= datetime.utcnow() else None
        }
        for n in news_list
    ]
