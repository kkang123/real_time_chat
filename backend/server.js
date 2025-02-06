// import http from "http";

// const PORT = process.env.PORT || 8080;

// const server = http.createServer((req, res) => {
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end("서버 실행 성공!");
// });

// server.listen(PORT, () => {
//   console.log(`✅ 서버가 ${PORT} 포트에서 실행 중...`);
// });

import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("✅ 클라이언트 연결됨");

  ws.on("message", (message) => {
    console.log(`📩 받은 메시지: ${message}`);

    // 연결된 모든 클라이언트에게 메시지 전송
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ 클라이언트 연결 종료");
  });
});

console.log("🚀 WebSocket 서버가 8080 포트에서 실행 중...");
