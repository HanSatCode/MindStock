from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.classes.player_repository import PlayerRepository
from app.classes.stock_repository import StockRepository

router = APIRouter()

@router.get("/")
def get_ranking(db: Session = Depends(get_db)):
    players = PlayerRepository.find_all(db)
    stocks = StockRepository.find_all(db)
    current_prices = {s.get_ticker(): s.get_current_price() for s in stocks}

    ranking = []
    for player in players:
        portfolio = player.get_portfolio()
        trade_history = player.get_trade_history()
        trade_count = len(trade_history)
        tendency = player.get_tendency()

        total_asset = portfolio.get_total_asset(current_prices)
        profit_rate = portfolio.get_profit_rate(current_prices)
        win_rate = round(tendency.get_profitability() * 100) if trade_count >= 25 else 0
        investment_type = tendency.get_tendency_code() if trade_count >= 25 else "NNNN"

        positions = portfolio.get_positions()
        top_stocks = sorted(
            [t for t, p in positions.items() if p.get_quantity() > 0],
            key=lambda t: positions[t].get_quantity(),
            reverse=True
        )[:2]

        ranking.append({
            "name": player.get_name(),
            "total_asset": round(total_asset, 2),
            "profit_rate": profit_rate,
            "balance": portfolio.get_balance(),
            "trade_count": trade_count,
            "win_rate": win_rate,
            "top_stocks": top_stocks,
            "investment_type": investment_type,
        })

    ranking.sort(key=lambda x: x["total_asset"], reverse=True)

    return [
        {**r, "rank": idx + 1}
        for idx, r in enumerate(ranking)
    ]