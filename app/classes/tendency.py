from typing import List
from app.classes.portfolio import Portfolio
from app.classes.trade_history import TradeHistory

class Tendency:
    def __init__(self):
        self.__risk: float = 0.5
        self.__duration: float = 0.5
        self.__concentration: float = 0.5
        self.__profitability: float = 0.5
        self.__avg_duration: float = 0.0
        self.__stock_count: int = 0

    def get_risk(self) -> float: return self.__risk
    def get_duration(self) -> float: return self.__duration
    def get_concentration(self) -> float: return self.__concentration
    def get_profitability(self) -> float: return self.__profitability
    def get_avg_duration(self) -> float: return self.__avg_duration
    def get_stock_count(self) -> int: return self.__stock_count

    def get_tendency_code(self) -> str:
        def classify(value: float, high: str, low: str) -> str:
            return high if value >= 0.5 else low
        risk          = classify(self.__risk,          "C", "A")
        duration      = classify(self.__duration,      "L", "S")
        concentration = classify(self.__concentration, "D", "F")
        profitability = classify(self.__profitability, "P", "L")
        return f"{risk}{duration}{concentration}{profitability}"

    def analyze_tendency(self, trade_history: List[TradeHistory], portfolio: Portfolio) -> None:
        if len(trade_history) < 25: return

        # 리스크: 0 Aggressive ~ 1 Conservative
        avg_vat = sum(each.get_trade_vat() for each in trade_history) / len(trade_history)
        self.__risk = 1.0 - min(1.0, avg_vat / 0.2)

        # 보유 기간: 0 Short ~ 1 Long
        buy_times = {}
        hold_times = []
        for t in sorted(trade_history, key=lambda x: x.get_timestamp()):
            if t.get_action() == "buy":
                if t.get_ticker() not in buy_times:
                    buy_times[t.get_ticker()] = []
                buy_times[t.get_ticker()].append(t.get_timestamp())
            elif t.get_action() == "sell" and t.get_ticker() in buy_times and buy_times[t.get_ticker()]:
                bought_at = buy_times[t.get_ticker()].pop(0)
                diff = (t.get_timestamp() - bought_at).total_seconds() / 60
                hold_times.append(diff)
        avg_hold = sum(hold_times) / len(hold_times) if hold_times else 0
        self.__duration = min(1.0, avg_hold / 360)
        self.__avg_duration = round(avg_hold)

        # 집중도: 0 Focused ~ 1 Diversified
        held_stocks = len([p for p in portfolio.get_positions().values() if p.get_quantity() > 0])
        if held_stocks == 0:
            held_stocks = len(set(t.get_ticker() for t in trade_history))
        self.__concentration = min(1.0, held_stocks / 9)
        self.__stock_count = held_stocks

        # 수익성: 0 Loss ~ 1 Profit
        buy_prices = {}
        profit_count = 0
        sell_count = 0
        for t in sorted(trade_history, key=lambda x: x.get_timestamp()):
            if t.get_action() == "buy":
                buy_prices[t.get_ticker()] = t.get_price()
            elif t.get_action() == "sell" and t.get_ticker() in buy_prices:
                sell_count += 1
                if t.get_price() > buy_prices[t.get_ticker()]:
                    profit_count += 1
        self.__profitability = profit_count / sell_count if sell_count > 0 else 0.5