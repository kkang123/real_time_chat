// // import http from "http";

// // const PORT = process.env.PORT || 8080;

// // const server = http.createServer((req, res) => {
// //   res.writeHead(200, { "Content-Type": "text/plain" });
// //   res.end("서버 실행 성공!");
// // });

// // server.listen(PORT, () => {
// //   console.log(`✅ 서버가 ${PORT} 포트에서 실행 중...`);
// // });
// // server.js

// import { WebSocketServer } from "ws";
// import http from "http";

// const PORT = 8080;
// const clients = new Set();

// // HTTP 서버 생성 (WebSocket 서버와 같이 사용)
// const server = http.createServer((req, res) => {
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end("WebSocket server is running...");
// });

// // WebSocket 서버 생성
// const wss = new WebSocketServer({ server });

// // 연결 이벤트
// wss.on("connection", (ws) => {
//   console.log("✅ 클라이언트 연결됨");
//   clients.add(ws);

//   // 메시지 수신 이벤트
//   ws.on("message", (data) => {
//     const message = data.toString();
//     console.log(`📨 받은 메시지: ${message}`);

//     // 모든 클라이언트에게 메시지 브로드캐스트
//     wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(message); // ✅ 메시지 전송
//       }
//     });
//   });

//   // 연결 종료 이벤트
//   ws.on("close", () => {
//     console.log("❌ 클라이언트 연결 종료");
//     clients.delete(ws);
//   });
// });

// // 서버 실행
// server.listen(PORT, () => {
//   console.log(`🚀 WebSocket 서버가 ${PORT} 포트에서 실행 중...`);
// });

import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

// WebSocket 서버 생성
const wss = new WebSocketServer({ port: 8080 });

// 연결된 클라이언트 관리
const clients = new Map();

wss.on("connection", (ws) => {
  const userId = uuidv4(); // 서버에서 UUID 생성
  clients.set(userId, ws);

  // 클라이언트에게 UUID 전송
  ws.send(JSON.stringify({ type: "assignId", userId }));

  console.log(`✅ 새 사용자 연결됨: ${userId}`);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (!data.senderId) return; // senderId가 없으면 무시

      const chatMessage = {
        id: uuidv4(), // 메시지 ID
        senderId: data.senderId, // 보낸 사람의 UUID
        text: data.text, // 메시지 내용
        timestamp: new Date().toISOString(),
      };

      console.log("📩 메시지 수신:", chatMessage);

      // 모든 클라이언트에게 메시지 전송
      clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(chatMessage));
        }
      });
    } catch (error) {
      console.error("❌ 메시지 처리 중 오류 발생:", error);
    }
  });

  ws.on("close", () => {
    clients.delete(userId);
    console.log(`❌ 사용자 연결 종료: ${userId}`);
  });
});

console.log("🚀 WebSocket 서버가 8080 포트에서 실행 중...");
