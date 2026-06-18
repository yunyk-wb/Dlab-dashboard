# Stage 1 — Mock 데이터 버전

서버 메모리의 mock 데이터만으로 동작. 외부 의존성(Meta API, DB) 없음.

## 목적

- 프론트 ↔ 백엔드 계약(응답 스키마)을 빠르게 확정
- API 키 없이 UI 개발 가능

## 구조

```
stage1/backend/
  main.py          # FastAPI 앱 + 모델 + 라우트 + mock 생성기 (단일 파일)
  requirements.txt
```

## 실행

```bash
# 루트에서
./dev.sh 1

# 또는 수동
cd stage1/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

프론트는 루트의 공유 `frontend/` 사용. `http://localhost:3000` 접속.

## 다음 단계

`stage2/` — Meta Marketing API 실데이터 + 캠페인 드릴다운.
