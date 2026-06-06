from sqlalchemy.orm import Session
from app.classes.news import News
from app.models import NewsModel
from typing import List


class NewsRepository:

    @staticmethod
    def find_all(db: Session) -> List[News]:
        news_list = db.query(NewsModel).order_by(NewsModel.timestamp.desc()).limit(20).all()
        return [NewsRepository.__to_news(n) for n in news_list]

    @staticmethod
    def find_by_ticker(db: Session, ticker: str) -> List[News]:
        news_list = db.query(NewsModel).filter(
            NewsModel.ticker == ticker
        ).order_by(NewsModel.timestamp.desc()).limit(10).all()
        return [NewsRepository.__to_news(n) for n in news_list]

    @staticmethod
    def save(db: Session, news: News) -> None:
        db.add(NewsModel(
            ticker = news.get_ticker(),
            outlook = news.get_outlook(),
            title = news.get_title(),
            description = news.get_description(),
            impact = news.get_impact(),
            reveal_time = news.get_reveal_time(),
            is_real = news.get_is_real()
        ))
        db.flush()

        # 20개 초과하면 오래된 것 삭제
        count = db.query(NewsModel).count()
        if count > 20:
            oldest = db.query(NewsModel).order_by(NewsModel.timestamp.asc()).first()
            if oldest:
                db.delete(oldest)
        db.commit()

    @staticmethod
    def __to_news(n: NewsModel) -> News:
        return News(
            ticker = n.ticker,
            outlook = n.outlook,
            title = n.title,
            description = n.description,
            impact = n.impact,
            timestamp = n.timestamp,
            reveal_time = n.reveal_time,
            is_real = n.is_real
        )