from sqlalchemy.orm import Session
from app.classes.player import Player
from app.classes.portfolio import Portfolio
from app.classes.tendency import Tendency
from app.classes.trade_history import TradeHistory
from app.classes.stock_position import StockPosition
from app.classes.trade_repository import TradeRepository
from app.models import PlayerModel, PortfolioModel, StockPositionModel, TendencyModel
from app.classes.authorization import Authorization
from typing import List


class PlayerRepository:
    @staticmethod
    def find_by_name(db: Session, name: str) -> Player | None:
        player_db = db.query(PlayerModel).filter(PlayerModel.name == name).first()
        if not player_db:
            return None

        # Portfolio 로드
        portfolio_db = db.query(PortfolioModel).filter(PortfolioModel.player_name == name).first()
        portfolio = Portfolio(100000)
        if portfolio_db:
            portfolio.set_balance(portfolio_db.balance)
            for p in portfolio_db.positions:
                portfolio.get_positions()[p.ticker] = StockPosition(
                    p.ticker, p.quantity, p.avg_price
                )

        # TradeHistory 로드 (TradeRepository 사용)
        trade_history = TradeRepository.find_by_name(db, name)

        # Tendency 로드 및 분석
        tendency = Tendency()
        tendency.analyze_tendency(trade_history, portfolio)

        # Player 생성 (password 포함)
        player = Player(name=player_db.name, password=player_db.password)
        player.set_portfolio(portfolio)
        player.set_tendency(tendency)
        for trade in trade_history:
            player.add_trade_history(trade)

        return player

    @staticmethod
    def is_name_exists(db: Session, name: str) -> bool:
        return db.query(PlayerModel).filter(PlayerModel.name == name).first() is not None

    @staticmethod
    def find_all(db: Session) -> List[Player]:
        players = db.query(PlayerModel).all()
        return [PlayerRepository.find_by_name(db, p.name) for p in players]

    @staticmethod
    def create(db: Session, name: str, password: str) -> Player:
        hashed = Authorization.encrypt_password(password)
        player = PlayerModel(name=name, password=hashed)
        db.add(player)
        db.commit()

        portfolio = PortfolioModel(player_name=name, balance=100000)
        db.add(portfolio)

        tendency = TendencyModel(player_name=name)
        db.add(tendency)
        db.commit()

        return Player(name=name, password=hashed)

    @staticmethod
    def save_portfolio(db: Session, name: str, portfolio: Portfolio) -> None:
        portfolio_db = db.query(PortfolioModel).filter(PortfolioModel.player_name == name).first()
        if not portfolio_db:
            return

        db.query(StockPositionModel).filter(
            StockPositionModel.portfolio_id == portfolio_db.id
        ).delete()
        for ticker, position in portfolio.get_positions().items():
            db.add(StockPositionModel(
                portfolio_id=portfolio_db.id,
                ticker=ticker,
                quantity=position.get_quantity(),
                avg_price=position.get_avg_price()
            ))
        portfolio_db.balance = portfolio.get_balance()
        db.commit()

    @staticmethod
    def save_tendency(db: Session, name: str, tendency: Tendency) -> None:
        tendency_db = db.query(TendencyModel).filter(TendencyModel.player_name == name).first()
        if tendency_db:
            tendency_db.risk = tendency._Tendency__risk
            tendency_db.duration = tendency._Tendency__duration
            tendency_db.concentration = tendency._Tendency__concentration
            tendency_db.profitability = tendency._Tendency__profitability
            db.commit()

    @staticmethod
    def save_trade(db: Session, name: str, trade: TradeHistory) -> None:
        TradeRepository.save(db, name, trade)
