import os
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt

class Authorization:
    __secret_key = os.getenv("SECRET_KEY")
    __algorithm = "HS256"
    __expire_minutes = 60 * 12 # 12시간

    @staticmethod
    def register(name: str, password: str) -> str: # 회원가입 시 JWT 토큰 생성 반환
        return Authorization.__create_token(name)

    @staticmethod
    def login(name: str, password: str, encrypted_password: str) -> str | None: # 비밀번호 검증 후, 맞으면 JWT 토큰 생성 반환 / 틀리면 None
        if not Authorization.__check_password(password, encrypted_password): return None
        return Authorization.__create_token(name)

    @staticmethod
    def get_name_from_token(token: str) -> str | None: # 토큰에서 플레이어의 name 반환
        try:
            payload = jwt.decode(token, Authorization.__secret_key, algorithms = [Authorization.__algorithm])
            return payload.get("sub")
        except JWTError: return None

    @staticmethod
    def encrypt_password(password: str) -> str: # 비밀번호 암호화
        return bcrypt.hashpw(password[:72].encode("utf-8"), bcrypt.gensalt(rounds = 4)).decode("utf-8")

    @staticmethod
    def __check_password(password: str, encrypted: str) -> bool: # 입력한 비밀번호와 암호화된 비밀번호 검증
        return bcrypt.checkpw(password[:72].encode("utf-8"), encrypted.encode("utf-8"))

    @staticmethod
    def __create_token(name: str) -> str: # JWT 토큰 생성
        expire = datetime.utcnow() + timedelta(minutes = Authorization.__expire_minutes)
        return jwt.encode({"sub": name, "exp": expire}, Authorization.__secret_key, algorithm = Authorization.__algorithm)