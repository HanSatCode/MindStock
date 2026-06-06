from sqlalchemy.orm import Session
from app.classes.stock import Stock
from app.models import StockModel
from typing import List


class StockRepository:

    @staticmethod
    def find_all(db: Session) -> List[Stock]:
        stocks = db.query(StockModel).all()
        return [StockRepository.__to_stock(s) for s in stocks]

    @staticmethod
    def find_by_ticker(db: Session, ticker: str) -> Stock:
        stock = db.query(StockModel).filter(StockModel.ticker == ticker).first()
        if not stock:
            return None
        return StockRepository.__to_stock(stock)

    @staticmethod
    def save(db: Session, ticker: str, stock: Stock) -> None:
        stock_db = db.query(StockModel).filter(StockModel.ticker == ticker).first()
        if not stock_db:
            return
        stock_db.current_price = stock.get_current_price()
        stock_db.open_price = stock.get_open_price()
        stock_db.current_shares = stock.get_current_shares()
        db.commit()

    @staticmethod
    def __to_stock(s: StockModel) -> Stock:
        return Stock(
            ticker = s.ticker,
            name = s.name,
            sector = s.sector,
            current_price = s.current_price,
            initial_price = s.initial_price,
            open_price = s.open_price,
            current_shares = s.current_shares,
            max_shares = s.max_shares,
            trade_vat = s.trade_vat,
            ownership_vat = s.ownership_vat
        )