from typing import List
from app.classes.portfolio import Portfolio
from app.classes.tendency import Tendency
from app.classes.trade_history import TradeHistory

class Player:
    def __init__(self, name: str, password: str):
        self.__name = name
        self.__password = password
        self.__portfolio = Portfolio()
        self.__tendency = Tendency()
        self.__trade_history: List[TradeHistory] = []

    def get_name(self) -> str: return self.__name
    def get_password(self) -> str: return self.__password
    def get_portfolio(self) -> Portfolio:  return self.__portfolio
    def get_tendency(self) -> Tendency: return self.__tendency
    def get_trade_history(self) -> List[TradeHistory]: return self.__trade_history
    def add_trade_history(self, trade: TradeHistory) -> None: self.__trade_history.append(trade)
    def set_portfolio(self, portfolio: Portfolio) -> None:
        self.__portfolio = portfolio
    def set_tendency(self, tendency: Tendency) -> None:
        self.__tendency = tendency