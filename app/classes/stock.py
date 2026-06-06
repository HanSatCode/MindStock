from typing import List
from app.classes.price_history import PriceHistory

class Stock:
    def __init__(self, ticker: str, name: str, sector: str,
                 current_price: int, initial_price: int, open_price: int,
                 current_shares: int, max_shares: int, trade_vat: float, ownership_vat: float):
        self.__ticker = ticker; self.__name = name; self.__sector = sector
        self.__current_price = current_price; self.__initial_price = initial_price
        self.__open_price = open_price if open_price else current_price
        self.__current_shares = current_shares; self.__max_shares = max_shares
        self.__trade_vat = trade_vat; self.__ownership_vat = ownership_vat
        self.__price_history: List[PriceHistory] = []

    def get_ticker(self) -> str: return self.__ticker
    def get_name(self) -> str: return self.__name
    def get_sector(self) -> str: return self.__sector
    def get_current_price(self) -> int: return self.__current_price
    def set_current_price(self, price: int) -> None: self.__current_price = price
    def get_initial_price(self) -> int: return self.__initial_price
    def get_open_price(self) -> int: return self.__open_price
    def set_open_price(self, price: int) -> None: self.__open_price = price
    def get_current_shares(self) -> int: return self.__current_shares
    def set_current_shares(self, shares: int) -> None: self.__current_shares = shares
    def get_max_shares(self) -> int: return self.__max_shares
    def get_trade_vat(self) -> float: return self.__trade_vat
    def get_ownership_vat(self) -> float: return self.__ownership_vat
    def get_price_history(self) -> List[PriceHistory]: return self.__price_history
    def add_price_history(self, price_history: PriceHistory) -> None: self.__price_history.append(price_history)