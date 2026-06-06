from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class TradeType(enum.Enum):
    buy = "buy"
    sell = "sell"

class PlayerModel(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, unique = True, index = True, nullable = False)
    password = Column(String, nullable = False)

    portfolio = relationship("PortfolioModel", back_populates = "player", uselist = False)
    tendency = relationship("TendencyModel", back_populates = "player", uselist = False)
    trade_history = relationship("TradeHistoryModel", back_populates = "player")

class StockModel(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key = True, index = True)
    ticker = Column(String, unique = True, nullable = False)
    name = Column(String, nullable = False)
    sector = Column(String, nullable = False)
    current_price = Column(Integer, nullable = False)
    initial_price = Column(Integer, nullable = False)
    open_price = Column(Integer, nullable = False)
    current_shares = Column(Integer, nullable = False)
    max_shares = Column(Integer, nullable = False)
    trade_vat = Column(Float, nullable = False)
    ownership_vat = Column(Float, nullable = False)

class PortfolioModel(Base):
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key = True, index = True)
    player_name = Column(String, ForeignKey("players.name"), nullable = False, unique = True)
    balance = Column(Integer, default = 100000)

    player = relationship("PlayerModel", back_populates = "portfolio")
    positions = relationship("StockPositionModel", back_populates = "portfolio")

class StockPositionModel(Base):
    __tablename__ = "stock_positions"
    id = Column(Integer, primary_key = True, index = True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable = False)
    ticker = Column(String, ForeignKey("stocks.ticker"), nullable = False)
    quantity = Column(Integer, nullable = False)
    avg_price = Column(Integer, nullable = False)

    portfolio = relationship("PortfolioModel", back_populates = "positions")

class TradeHistoryModel(Base):
    __tablename__ = "trade_histories"
    id = Column(Integer, primary_key = True, index = True)
    player_name = Column(String, ForeignKey("players.name"), nullable = False)
    ticker = Column(String, ForeignKey("stocks.ticker"), nullable = False)
    action = Column(Enum(TradeType), nullable = False)
    price = Column(Integer, nullable = False)
    quantity = Column(Integer, nullable = False)
    total_cost = Column(Integer, nullable = False)
    trade_vat = Column(Float, nullable = False)
    timestamp = Column(DateTime, default = datetime.utcnow)

    player = relationship("PlayerModel", back_populates = "trade_history")

class NewsModel(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key = True, index = True)
    ticker = Column(String, nullable = False)
    outlook = Column(String, nullable = False)
    title = Column(String, nullable = False)
    description = Column(String, nullable = False)
    impact = Column(Float, nullable = False)
    timestamp = Column(DateTime, default = datetime.utcnow)
    reveal_time = Column(DateTime, nullable = False)
    is_real = Column(Boolean, nullable = True)

class TendencyModel(Base):
    __tablename__ = "tendency"
    id = Column(Integer, primary_key = True, index = True)
    player_name = Column(String, ForeignKey("players.name"), nullable = False, unique = True)
    risk = Column(Float, default = 0.5)
    duration = Column(Float, default = 0.5)
    concentration = Column(Float, default = 0.5)
    profitability = Column(Float, default = 0.5)

    player = relationship("PlayerModel", back_populates = "tendency")