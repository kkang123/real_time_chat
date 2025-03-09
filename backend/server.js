import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

// WebSocket 서버 생성
const wss = new WebSocketServer({ port: 8080 });

// 연결된 클라이언트 관리
const clients = new Map();

// 만료 시간 갱신 함수 (미리 정의)
const updateExpiryTime = (userId) => {
  const client = clients.get(userId);
  if (client) {
    // 만료 시간 갱신 (현재 시간 + 10분)
    const newExpiryTime = new Date(Date.now() + 600000).toISOString();

    client.expiryTime = newExpiryTime;
    clients.set(userId, client);

    // 클라이언트에게 갱신된 만료 시간 알림
    client.ws.send(
      JSON.stringify({
        type: "expiryUpdate",
        expiryTime: newExpiryTime,
      })
    );

    console.log(`⏰ ${userId}의 만료 시간 갱신: ${newExpiryTime}`);
    return newExpiryTime;
  }
  return null;
};

wss.on("connection", (ws) => {
  const userId = uuidv4(); // 서버에서 UUID 생성

  // 만료 시간 설정 (현재 시간 + 10분)
  const expiryTime = new Date(Date.now() + 600000).toISOString(); // 10분 = 600000 밀리초

  clients.set(userId, {
    ws,
    expiryTime,
  }); // 클라이언트 정보와 만료 시간 저장

  // 클라이언트에게 UUID와 만료 시간 전송
  ws.send(
    JSON.stringify({
      type: "assignId",
      userId,
      expiryTime,
    })
  );

  console.log(`✅ 새 사용자 연결됨: ${userId}, 만료 시간: ${expiryTime}`);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (!data.senderId) return; // senderId가 없으면 무시

      // 메시지를 보낸 클라이언트의 만료 시간 확인
      const client = clients.get(data.senderId);
      if (!client) {
        // 클라이언트 정보가 없는 경우
        ws.send(
          JSON.stringify({
            type: "expired",
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          })
        );
        return;
      }

      const now = new Date();
      const expiry = new Date(client.expiryTime);

      if (now > expiry) {
        // 만료된 경우
        ws.send(
          JSON.stringify({
            type: "expired",
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          })
        );
        return;
      }

      // 메시지 전송 시 만료 시간 갱신 요청이 있는 경우
      if (data.updateExpiry) {
        updateExpiryTime(data.senderId);
      }

      const chatMessage = {
        id: uuidv4(), // 메시지 ID
        senderId: data.senderId, // 보낸 사람의 UUID
        senderName: data.senderName,
        text: data.text, // 메시지 내용
        timestamp: new Date().toISOString(),
      };

      console.log("📩 메시지 수신:", chatMessage);

      // 모든 클라이언트에게 메시지 전송
      clients.forEach((clientData, id) => {
        if (clientData.ws.readyState === ws.OPEN) {
          clientData.ws.send(JSON.stringify(chatMessage));
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
