from app.classes.connection_manager import ConnectionManager
from app.classes.simulation_engine import SimulationEngine
from app.classes.price_history import PriceHistory
from app.classes.stock_repository import StockRepository
from app.database import SessionLocal
from app.models import StockModel
from datetime import datetime
import asyncio

connection_manager = ConnectionManager()
simulation_engine = SimulationEngine(connection_manager)

market_was_open = False

async def db_sync_task():
    global market_was_open
    while True:
        await asyncio.sleep(5)
        db = SessionLocal()
        try:
            is_open = SimulationEngine.is_market_open()

            stocks_db = db.query(StockModel).all()

            if is_open and not market_was_open:
                for stock_db in stocks_db:
                    stock_db.open_price = stock_db.current_price
                db.commit()
                market_was_open = True
            elif not is_open:
                market_was_open = False

            if not is_open:
                continue

            stock_data = []

            for stock_db in stocks_db:
                stock = next(
                    (s for s in simulation_engine._SimulationEngine__stocks
                     if s.get_ticker() == stock_db.ticker), None
                )
                if not stock:
                    continue

                # DB 주가 업데이트 (StockRepository.save 사용)
                StockRepository.save(db, stock.get_ticker(), stock)

                # 메모리 price_history 업데이트
                stock.add_price_history(PriceHistory(stock.get_current_price(), datetime.utcnow()))

                stock_data.append({
                    "ticker": stock.get_ticker(),
                    "name": stock.get_name(),
                    "current_price": stock.get_current_price(),
                    "open_price": stock_db.open_price,
                    "ownership_vat": stock_db.ownership_vat,
                    "change_rate": round((stock.get_current_price() - stock_db.open_price) / stock_db.open_price * 100, 2)
                })

            db.commit()

            if stock_data:
                await connection_manager.broadcast({
                    "type": "price_update",
                    "data": stock_data,
                    "fear_greed": round(simulation_engine._SimulationEngine__fear_greed_index, 1)
                })

        except Exception as e:
            print(f"DB 동기화 오류: {e}")
            db.rollback()
        finally:
            db.close()