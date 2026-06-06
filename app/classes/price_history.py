from datetime import datetime

class PriceHistory:
    def __init__(self, price: int, timestamp: datetime):
        self.__price = price
        self.__timestamp = timestamp

    def get_price(self) -> int: return self.__price
    def get_timestamp(self) -> datetime: return self.__timestamp