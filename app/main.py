from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, stocks, trade, news, tendency, ranking
from app.core import simulation_engine, connection_manager, db_sync_task
from app.classes.stock_repository import StockRepository
import asyncio

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
app.include_router(trade.router, prefix="/trade", tags=["trade"])
app.include_router(news.router, prefix="/news", tags=["news"])
app.include_router(tendency.router, prefix="/tendency", tags=["tendency"])
app.include_router(ranking.router, prefix="/ranking", tags=["ranking"])

@app.on_event("startup")
async def startup():
    session = SessionLocal()
    try:
        from app.routers.stocks import init_stocks
        init_stocks(session)
        stocks_list = StockRepository.find_all(session)
        for stock in stocks_list:
            simulation_engine._SimulationEngine__stocks.append(stock)
    finally:
        session.close()
    simulation_engine.set_start_market()
    asyncio.create_task(simulation_engine.run_simulate())
    asyncio.create_task(db_sync_task())

@app.on_event("shutdown")
async def shutdown():
    simulation_engine.set_stop_market()