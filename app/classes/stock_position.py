class StockPosition:
    def __init__(self, ticker: str, quantity: int = 0, avg_price: int = 0):
        self.__ticker = ticker
        self.__quantity = quantity
        self.__avg_price = avg_price

    def get_ticker(self) -> str: return self.__ticker
    def get_quantity(self) -> int: return self.__quantity
    def set_quantity(self, quantity: int) -> None: self.__quantity = quantity
    def get_avg_price(self) -> int: return self.__avg_price

    def set_avg_price(self, price: int, qty: int) -> None:
        self.__avg_price = round( (self.__avg_price * self.__quantity + price * qty) / (self.__quantity + qty) )