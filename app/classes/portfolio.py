from typing import Dict
from app.classes.stock_position import StockPosition

class Portfolio:
    def __init__(self, balance: int = 100000):
        self.__balance = balance
        self.__initial_balance = balance
        self.__positions: Dict[str, StockPosition] = {}

    def get_balance(self) -> int: return self.__balance
    def set_balance(self, amount: int) -> None: self.__balance = amount
    def get_positions(self) -> Dict[str, StockPosition]: return self.__positions

    def get_total_asset(self, current_prices: Dict[str, int]) -> int: # 총 자산 계산 (현금 + 보유 종목 평가액)
        total = self.__balance
        for ticker, position in self.__positions.items():
            if ticker in current_prices:
                total += current_prices[ticker] * position.get_quantity()
        return total

    def get_profit_rate(self, current_prices: Dict[str, int]) -> float: # 초기 자본 대비 수익률 계산
        total_asset = self.get_total_asset(current_prices)
        return round((total_asset - self.__initial_balance) / self.__initial_balance * 100, 2)

    def buy(self, ticker: str, qty: int, price: int, spread: float = 0.05) -> bool:
        total_cost = round(price * (1 + spread)) * qty
        if self.__balance < total_cost: return False
        self.__balance -= total_cost
        if ticker in self.__positions:
            holding = self.__positions[ticker]
            holding.set_avg_price(price, qty)
            holding.set_quantity(holding.get_quantity() + qty)
        else: self.__positions[ticker] = StockPosition(ticker, qty, price)
        return True

    def sell(self, ticker: str, qty: int, price: int, spread: float = 0.05) -> bool:
        if ticker not in self.__positions: return False
        holding = self.__positions[ticker]
        if holding.get_quantity() < qty: return False
        self.__balance += round(price * (1 - spread)) * qty
        holding.set_quantity(holding.get_quantity() - qty)
        if holding.get_quantity() == 0: del self.__positions[ticker]
        return True