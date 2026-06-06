from typing import List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.__active_connections: List[WebSocket] = []

    async def add_connection(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.__active_connections.append(websocket)

    def remove_connection(self, websocket: WebSocket) -> None:
        self.__active_connections.remove(websocket)

    async def broadcast(self, data: dict) -> None:
        if not self.__active_connections:
            return
        message = json.dumps(data, ensure_ascii=False)
        for connection in self.__active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                if connection in self.__active_connections:
                    self.__active_connections.remove(connection)