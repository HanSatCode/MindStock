from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.classes.authorization import Authorization
from app.classes.trade_history import TradeHistory
from app.classes.player_repository import PlayerRepository
from app.classes.stock_repository import StockRepository

from app.core import simulation_engine
from datetime import datetime, timedelta

router = APIRouter()

COOLDOWN_SECONDS = 30
SPREAD_RATE = 0.05

last_trade_time = {}

class TradeRequest(BaseModel):
    ticker: str
    quantity: int

def check_cooldown(name: str, ticker: str):
    key = f"{name}_{ticker}"
    last = last_trade_time.get(key)
    if last and datetime.utcnow() - last < timedelta(seconds=COOLDOWN_SECONDS):
        remaining = COOLDOWN_SECONDS - (datetime.utcnow() - last).seconds
        raise HTTPException(status_code=429, detail=f"같은 종목은 {remaining}초 후에 거래할 수 있습니다")

def update_cooldown(name: str, ticker: str):
    key = f"{name}_{ticker}"
    last_trade_time[key] = datetime.utcnow()

@router.post("/buy")
def buy(data: TradeRequest, token: str = Query(...), db: Session = Depends(get_db)):
    if data.quantity <= 0: raise HTTPException(status_code = 400, detail = "수량은 1 이상이어야 합니다")

    name = Authorization.get_name_from_token(token)
    check_cooldown(name, data.ticker)

    stock = StockRepository.find_by_ticker(db, data.ticker)
    player = PlayerRepository.find_by_name(db, name)

    buy_price = round(stock.get_current_price() * (1 + SPREAD_RATE))

    success = player.get_portfolio().buy(data.ticker, data.quantity, stock.get_current_price(), SPREAD_RATE)
    if not success:
        raise HTTPException(status_code = 400, detail = "잔고가 부족합니다")

    trade = TradeHistory(
        ticker=data.ticker,
        action="buy",
        quantity=data.quantity,
        price=buy_price,
        total_cost=buy_price * data.quantity,
        trade_vat=stock.get_trade_vat(),
        timestamp=datetime.utcnow()
    )
    player.add_trade_history(trade)

    PlayerRepository.save_portfolio(db, name, player.get_portfolio())
    PlayerRepository.save_trade(db, name, trade)

    simulation_engine._SimulationEngine__volume_buy[data.ticker] = \
        simulation_engine._SimulationEngine__volume_buy.get(data.ticker, 0) + data.quantity

    update_cooldown(name, data.ticker)

    return {
        "message": "매수 완료",
        "ticker": data.ticker,
        "quantity": data.quantity,
        "buy_price": buy_price,
        "total_cost": buy_price * data.quantity,
        "remaining_balance": player.get_portfolio().get_balance()
    }

@router.post("/sell")
def sell(data: TradeRequest, token: str = Query(...), db: Session = Depends(get_db)):
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="수량은 1 이상이어야 합니다")

    name = Authorization.get_name_from_token(token)
    check_cooldown(name, data.ticker)

    stock = StockRepository.find_by_ticker(db, data.ticker)
    player = PlayerRepository.find_by_name(db, name)

    sell_price = round(stock.get_current_price() * (1 - SPREAD_RATE))

    success = player.get_portfolio().sell(data.ticker, data.quantity, stock.get_current_price(), SPREAD_RATE)
    if not success:
        raise HTTPException(status_code=400, detail="보유 수량이 부족합니다")

    trade = TradeHistory(
        ticker=data.ticker,
        action="sell",
        quantity=data.quantity,
        price=sell_price,
        total_cost=sell_price * data.quantity,
        trade_vat=stock.get_trade_vat(),
        timestamp=datetime.utcnow()
    )
    player.add_trade_history(trade)

    PlayerRepository.save_portfolio(db, name, player.get_portfolio())
    PlayerRepository.save_trade(db, name, trade)

    simulation_engine._SimulationEngine__volume_sell[data.ticker] = \
        simulation_engine._SimulationEngine__volume_sell.get(data.ticker, 0) + data.quantity

    update_cooldown(name, data.ticker)

    return {
        "message": "매도 완료",
        "ticker": data.ticker,
        "quantity": data.quantity,
        "sell_price": sell_price,
        "total_gain": sell_price * data.quantity,
        "remaining_balance": player.get_portfolio().get_balance()
    }

@router.get("/portfolio")
def get_portfolio(token: str = Query(...), db: Session = Depends(get_db)):
    name = Authorization.get_name_from_token(token)
    if not name:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")

    player = PlayerRepository.find_by_name(db, name)

    portfolio = player.get_portfolio()
    stocks = StockRepository.find_all(db)
    current_prices = {s.get_ticker(): s.get_current_price() for s in stocks}

    result = []
    for ticker, position in portfolio.get_positions().items():
        current_price = current_prices.get(ticker, 0)
        current_value = current_price * position.get_quantity()
        profit = current_value - (position.get_avg_price() * position.get_quantity())
        profit_rate = round((current_price - position.get_avg_price()) / position.get_avg_price() * 100, 2) if position.get_avg_price() > 0 else 0
        result.append({
            "ticker": ticker,
            "quantity": position.get_quantity(),
            "avg_price": position.get_avg_price(),
            "current_price": current_price,
            "current_value": current_value,
            "profit": round(profit, 2),
            "profit_rate": profit_rate
        })

    return {
        "balance": portfolio.get_balance(),
        "total_asset": portfolio.get_total_asset(current_prices),
        "portfolio": result
    }

@router.get("/history")
def get_trade_history(token: str = Query(...), db: Session = Depends(get_db), limit: int = Query(50)):
    name = Authorization.get_name_from_token(token)
    player = PlayerRepository.find_by_name(db, name)
    history = player.get_trade_history()[-limit:]

    return [
        {
            "ticker": t.get_ticker(),
            "action": t.get_action(),
            "quantity": t.get_quantity(),
            "price": t.get_price(),
            "total_cost": t.get_total_cost(),
            "timestamp": t.get_timestamp()
        }
        for t in history
    ]