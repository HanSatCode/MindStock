import os
import asyncio
import math
import random
from typing import List
from app.classes.stock import Stock
from app.classes.news import News
from app.classes.connection_manager import ConnectionManager
from datetime import datetime, timedelta
from openai import AsyncOpenAI


class SimulationEngine:
    __tick_interval: int = 5
    __news_llm = AsyncOpenAI(
                api_key = os.getenv("MINDLOGIC_API_KEY"),
                base_url = "https://factchat-cloud.mindlogic.ai/v1/gateway"
            )

    def __init__(self, connection_manager: ConnectionManager):
        self.__connection_manager = connection_manager
        self.__is_running: bool = False
        self.__stocks: List[Stock] = []
        self.__fear_greed_index: float = 50.0
        self.__news_interval: int = 300
        self.__new_unrevealed: List = []
        self.__news_timer: int = 0
        self.__volume_buy: dict = {}
        self.__volume_sell: dict = {}

    def set_start_market(self) -> None:
        self.__is_running = True

    def set_stop_market(self) -> None:
        self.__is_running = False

    async def run_simulate(self) -> None:
        market_was_open = False
        while self.__is_running:
            await asyncio.sleep(SimulationEngine.__tick_interval)

            if not SimulationEngine.is_market_open():
                if market_was_open:
                    await self.__connection_manager.broadcast({
                        "type": "market_closed",
                        "message": "장이 마감되었습니다."
                    })
                    market_was_open = False
                continue

            if not market_was_open:
                await self.__connection_manager.broadcast({
                    "type": "market_open",
                    "message": "장이 시작되었습니다."
                })
                market_was_open = True

            self.__news_timer += SimulationEngine.__tick_interval
            if self.__news_timer >= self.__news_interval:
                self.__news_timer = 0
                self.__news_interval = random.randint(500, 1000)
                await self.generate_news()

            self.apply_bot_trading()
            await self.apply_news_effect()
            self.apply_ownership_tax()
            self.__fear_greed_index = self.update_fear_greed_index()

            stock_data = []
            for stock in self.__stocks:
                new_price = self.update_price(stock)
                stock.set_current_price(new_price)
                stock_data.append({
                    "ticker": stock.get_ticker(),
                    "name": stock.get_name(),
                    "current_price": new_price,
                })

            await self.__connection_manager.broadcast({
                "type": "price_update",
                "data": stock_data,
                "fear_greed": round(self.__fear_greed_index, 1)
            })

    def update_fear_greed_index(self) -> float:
        total_buy = sum(self.__volume_buy.values())
        total_sell = sum(self.__volume_sell.values())
        total = total_buy + total_sell
        if total == 0:
            self.__fear_greed_index = self.__fear_greed_index * 0.95 + 50.0 * 0.05
        else:
            buy_ratio = total_buy / total
            self.__fear_greed_index = self.__fear_greed_index * 0.7 + buy_ratio * 100 * 0.3
        return max(0.0, min(100.0, self.__fear_greed_index))

    def update_price(self, stock: Stock) -> float:
        volatility = 0.01 + stock.get_trade_vat() * 0.6
        noise = random.gauss(0, volatility)
        fg_effect = (self.__fear_greed_index - 50) / 50 * 0.03
        price_ratio = stock.get_current_price() / stock.get_initial_price()
        mean_reversion = max(-0.05, min(0.05, (1.0 - price_ratio) * 0.02))
        ticker = stock.get_ticker()
        buy_qty = self.__volume_buy.pop(ticker, 0)
        sell_qty = self.__volume_sell.pop(ticker, 0)
        net = buy_qty - sell_qty
        trade_effect = max(-0.15, min(0.15, (net / stock.get_current_shares()) * 5.0))
        log_return = max(-0.15, min(0.15, noise + fg_effect + mean_reversion + trade_effect))
        return max(100, round(stock.get_current_price() * math.exp(log_return)))

    def apply_bot_trading(self) -> None:
        for stock in self.__stocks:
            ticker = stock.get_ticker()
            net = self.__volume_buy.get(ticker, 0) - self.__volume_sell.get(ticker, 0)
            if net > 0:
                self.__volume_sell[ticker] = self.__volume_sell.get(ticker, 0) + int(net * random.uniform(0.3, 0.6))
            elif net < 0:
                self.__volume_buy[ticker] = self.__volume_buy.get(ticker, 0) + int(abs(net) * random.uniform(0.3, 0.6))

    async def generate_news(self) -> None:
        if not self.__stocks:
            return

        news_type = random.choices(
            ["single", "sector", "market"],
            weights = [60, 25, 15]
        )[0]

        outlook = random.choices(
            ["positive", "negative", "neutral"],
            weights = [20, 40, 40]
        )[0]

        if news_type == "single":
            target_stock = random.choice(self.__stocks)
            target_stocks = [target_stock]
            context = f"종목명: {target_stock.get_name()} ({target_stock.get_ticker()})\n섹터: {target_stock.get_sector()}\n현재가: {target_stock.get_current_price()}원"
        elif news_type == "sector":
            target_stock = random.choice(self.__stocks)
            sector = target_stock.get_sector()
            target_stocks = [s for s in self.__stocks if s.get_sector() == sector]
            context = f"섹터: {sector}\n관련 종목: {', '.join([s.get_name() for s in target_stocks])}"
        else:
            target_stocks = self.__stocks
            context = f"전체 시장 뉴스\n상장 종목 수: {len(self.__stocks)}개"

        if news_type == "single":
            prompt = f"""
당신은 모의 주식 게임의 뉴스 생성기입니다.
{context}
전망: {outlook}

위 종목에 대한 짧은 뉴스를 생성해주세요. 가능하다면 현실성 있었으면 좋겠습니다.
JSON 형식으로만 응답하세요:
{{
    "title": "뉴스 제목 (20자 이내)",
    "description": "뉴스 내용 (50자 이내)",
    "outlook": "{outlook}"
}}
"""
        elif news_type == "sector":
            prompt = f"""
당신은 모의 주식 게임의 뉴스 생성기입니다.
{context}
전망: {outlook}

위 섹터 전체에 영향을 미치는 짧은 뉴스를 생성해주세요. 가능하다면 현실성 있었으면 좋겠습니다.
JSON 형식으로만 응답하세요:
{{
    "title": "뉴스 제목 (20자 이내)",
    "description": "뉴스 내용 (50자 이내)",
    "outlook": "{outlook}"
}}
"""
        else:
            prompt = f"""
당신은 모의 주식 게임의 뉴스 생성기입니다.
{context}
전망: {outlook}

전체 시장에 영향을 미치는 거시경제 뉴스를 생성해주세요. (금리, 환율, 정책 등) 가능하다면 현실성 있었으면 좋겠습니다.
JSON 형식으로만 응답하세요:
{{
    "title": "뉴스 제목 (20자 이내)",
    "description": "뉴스 내용 (50자 이내)",
    "outlook": "{outlook}"
}}
"""

        try:
            response = await SimulationEngine.__news_llm.chat.completions.create(
                model = "claude-haiku-4-5-20251001",
                messages = [{"role": "user", "content": prompt}],
                max_tokens = 200
            )
            import json
            content = response.choices[0].message.content
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            news_data = json.loads(content)

            impact = round(random.uniform(0.049, 0.262), 3)
            if news_data["outlook"] == "negative":
                impact = -impact
            elif news_data["outlook"] == "neutral":
                impact = 0

            if news_type == "sector":
                impact *= 0.7
            elif news_type == "market":
                impact *= 0.5

            is_real = random.random() > 0.3
            reveal_time = datetime.utcnow() + timedelta(minutes = random.randint(5, 10))

            for stock in target_stocks:
                news = News(
                    ticker = stock.get_ticker(),
                    outlook = news_data["outlook"],
                    title = news_data["title"],
                    description = news_data["description"],
                    impact = impact,
                    timestamp = datetime.utcnow(),
                    reveal_time = reveal_time,
                    is_real = is_real
                )
                self.__new_unrevealed.append({
                    "news": news,
                    "is_real": is_real,
                    "stock": stock,
                })

            # DB 저장
            from app.database import SessionLocal
            from app.classes.news_repository import NewsRepository
            if news_type == "sector":
                rep_ticker = f"[{target_stocks[0].get_sector()}섹터]"
            elif news_type == "market":
                rep_ticker = "[시장전체]"
            else:
                rep_ticker = target_stocks[0].get_ticker()

            db = SessionLocal()
            try:
                news_to_save = News(
                    ticker = rep_ticker,
                    outlook = news_data["outlook"],
                    title = news_data["title"],
                    description = news_data["description"],
                    impact = impact,
                    timestamp = datetime.utcnow(),
                    reveal_time = reveal_time,
                    is_real = is_real
                )
                NewsRepository.save(db, news_to_save)
            finally:
                db.close()

            # broadcast
            if news_type == "single":
                await self.__connection_manager.broadcast({
                    "type": "news",
                    "news_type": "single",
                    "ticker": target_stocks[0].get_ticker(),
                    "title": news_data["title"],
                    "description": news_data["description"],
                    "outlook": news_data["outlook"],
                    "is_real": None
                })
            elif news_type == "sector":
                await self.__connection_manager.broadcast({
                    "type": "news",
                    "news_type": "sector",
                    "ticker": f"[{target_stocks[0].get_sector()}섹터]",
                    "tickers": [s.get_ticker() for s in target_stocks],
                    "title": news_data["title"],
                    "description": news_data["description"],
                    "outlook": news_data["outlook"],
                    "is_real": None
                })
            else:
                await self.__connection_manager.broadcast({
                    "type": "news",
                    "news_type": "market",
                    "ticker": "[시장전체]",
                    "tickers": [s.get_ticker() for s in target_stocks],
                    "title": news_data["title"],
                    "description": news_data["description"],
                    "outlook": news_data["outlook"],
                    "is_real": None
                })

        except Exception as e:
            print(f"뉴스 생성 오류: {e}")

    async def apply_news_effect(self) -> None:
        now = datetime.utcnow()
        to_reveal = [n for n in self.__new_unrevealed if n["news"].get_reveal_time() <= now]
        for item in to_reveal:
            self.__new_unrevealed.remove(item)
            stock = item["stock"]
            news = item["news"]
            effect = news.get_impact() if item["is_real"] else -news.get_impact() * 0.5
            new_price = max(100, round(stock.get_current_price() * math.exp(effect)))
            stock.set_current_price(new_price)
            await self.__connection_manager.broadcast({
                "type": "news_reveal",
                "is_real": item["is_real"],
                "ticker": stock.get_ticker(),
                "new_price": new_price
            })

    def apply_ownership_tax(self) -> None:
        from app.database import SessionLocal
        from app.classes.player_repository import PlayerRepository

        current_prices = {s.get_ticker(): s.get_current_price() for s in self.__stocks}

        db = SessionLocal()
        try:
            players = PlayerRepository.find_all(db)
            for player in players:
                portfolio = player.get_portfolio()
                positions = portfolio.get_positions().copy()
                changed = False

                for ticker, position in positions.items():
                    stock = next((s for s in self.__stocks if s.get_ticker() == ticker), None)
                    if not stock: continue

                    tax_rate = stock.get_ownership_vat() * (SimulationEngine.__tick_interval / 86400)
                    tax = round(position.get_quantity() * current_prices.get(ticker, 0) * tax_rate)

                    if tax <= 0: continue

                    if portfolio.get_balance() >= tax:
                        portfolio.set_balance(portfolio.get_balance() - tax)
                    else:
                        # 잔고 부족시 강제 매도
                        portfolio.sell(ticker, position.get_quantity(), current_prices.get(ticker, 0), 0)

                    changed = True

                if changed:
                    PlayerRepository.save_portfolio(db, player.get_name(), portfolio)
        finally:
            db.close()

    @staticmethod
    def is_market_open() -> bool:
        return True
        now = datetime.now()
        return 8 <= now.hour < 22