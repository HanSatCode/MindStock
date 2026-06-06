from datetime import datetime

class TradeHistory:
    def __init__(self, ticker: str, action: str, price: int, quantity: int,
                 total_cost: int, trade_vat: float, timestamp: datetime):
        self.__ticker = ticker
        self.__action = action
        self.__price = price
        self.__quantity = quantity
        self.__total_cost = total_cost
        self.__trade_vat = trade_vat
        self.__timestamp = timestamp

    def get_ticker(self) -> str: return self.__ticker
    def get_action(self) -> str: return self.__action
    def get_price(self) -> int: return self.__price
    def get_quantity(self) -> int: return self.__quantity
    def get_total_cost(self) -> int: return self.__total_cost
    def get_trade_vat(self) -> float: return self.__trade_vat
    def get_timestamp(self) -> datetime: return self.__timestamp