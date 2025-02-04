## 서버 실행

`npm start`

## 라이브러리 설치

`npm install express ws aws-sdk dotenv cors`

- express → API 서버 (WebSocket을 보조할 수도 있음)
- ws → WebSocket 서버 구현
- aws-sdk → AWS Lambda, DynamoDB 연동
- dotenv → 환경 변수 관리
- cors → CORS 정책 설정 (프론트엔드와 통신)

## 📂 backend 디렉토리 구조

backend/
│── node_modules/ # npm 패키지들이 설치되는 폴더 (자동 생성)
│── .env # 환경 변수 파일 (AWS 인증 정보, DB 테이블명 등)
│── package.json # 프로젝트 정보 및 의존성 목록
│── package-lock.json # npm 패키지 버전 고정
│── server.js # 웹 소켓 서버 실행 파일 (WebSocket + AWS 연결)
│── dynamoDB.js # DynamoDB 관련 로직 분리
│── api/ # REST API 관련 파일 (선택)
│ ├── index.js # Express 서버 (선택)
│── utils/ # 유틸리티 함수 모음 (선택)
│ ├── logger.js # 로그 관리 (선택)
└── README.md # 프로젝트 설명

초기 세팅
