// import http from "http";

// const PORT = process.env.PORT || 8080;

// const server = http.createServer((req, res) => {
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end("서버 실행 성공!");
// });

// server.listen(PORT, () => {
//   console.log(`✅ 서버가 ${PORT} 포트에서 실행 중...`);
// });
// server.js

import { WebSocketServer } from "ws";
import http from "http";

const PORT = 8080;
const clients = new Set();

// HTTP 서버 생성 (WebSocket 서버와 같이 사용)
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running...");
});

// WebSocket 서버 생성
const wss = new WebSocketServer({ server });

// 연결 이벤트
wss.on("connection", (ws) => {
  console.log("✅ 클라이언트 연결됨");
  clients.add(ws);

  // 메시지 수신 이벤트
  ws.on("message", (data) => {
    const message = data.toString();
    console.log(`📨 받은 메시지: ${message}`);

    // 모든 클라이언트에게 메시지 브로드캐스트
    clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  // 연결 종료 이벤트
  ws.on("close", () => {
    console.log("❌ 클라이언트 연결 종료");
    clients.delete(ws);
  });
});

// 서버 실행
server.listen(PORT, () => {
  console.log(`🚀 WebSocket 서버가 ${PORT} 포트에서 실행 중...`);
});
