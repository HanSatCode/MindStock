from sqlalchemy.orm import Session
from app.classes.trade_history import TradeHistory
from app.models import TradeHistoryModel, TradeType
from typing import List


class TradeRepository:

    @staticmethod
    def find_by_name(db: Session, name: str) -> List[TradeHistory]:
        trades = db.query(TradeHistoryModel).filter(
            TradeHistoryModel.player_name == name
        ).order_by(TradeHistoryModel.timestamp.desc()).all()
        return [
            TradeHistory(
                ticker = t.ticker,
                action = t.action.value,
                quantity = t.quantity,
                price = t.price,
                total_cost = t.total_cost,
                trade_vat = t.trade_vat,
                timestamp = t.timestamp
            )
            for t in trades
        ]

    @staticmethod
    def save(db: Session, name: str, trade: TradeHistory) -> None:
        db.add(TradeHistoryModel(
            player_name = name,
            ticker = trade.get_ticker(),
            action = TradeType[trade.get_action()],
            quantity = trade.get_quantity(),
            price = trade.get_price(),
            total_cost = trade.get_total_cost(),
            trade_vat = trade.get_trade_vat(),
        ))
        db.commit()
