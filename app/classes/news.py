from datetime import datetime

class News:
    def __init__(self, ticker: str, outlook: str, title: str, description: str, impact: float, timestamp: datetime, reveal_time: datetime, is_real: bool = None):
        self.__ticker = ticker
        self.__outlook = outlook
        self.__title = title
        self.__description = description
        self.__impact = impact
        self.__timestamp = timestamp
        self.__reveal_time = reveal_time
        self.__is_real = is_real

    def get_ticker(self) -> str: return self.__ticker
    def get_outlook(self) -> str: return self.__outlook
    def get_title(self) -> str: return self.__title
    def get_description(self) -> str: return self.__description
    def get_impact(self) -> float: return self.__impact
    def get_timestamp(self) -> datetime: return self.__timestamp
    def get_reveal_time(self) -> datetime: return self.__reveal_time
    def get_is_real(self) -> bool: return self.__is_real