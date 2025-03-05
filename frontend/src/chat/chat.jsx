import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const WEBSOCKET_URL = "ws://localhost:8080"; // WebSocket 서버 주소

function Chat() {
  const [messages, setMessages] = useState([]); // 채팅 메시지 상태
  const [input, setInput] = useState(""); // 입력 필드 상태
  const [userId, setUserId] = useState(null); // 사용자 UUID를 서버로부터 받아와서 저장
  const ws = useRef(null); // WebSocket 인스턴스
  const isComposing = useRef(false); // 한글 조합 상태를 추적하기 위한 ref
  const messagesEndRef = useRef(null); // 스크롤 고정을 위한 ref

  // WebSocket 연결
  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("✅ WebSocket 연결 성공");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "assignId") {
        setUserId(data.userId); // 서버에서 받은 UUID 저장
        console.log("🆔 서버에서 받은 userId:", data.userId);
        return;
      }

      setMessages((prev) => [...prev, data]);
    };

    ws.current.onclose = () => {
      console.log("❌ WebSocket 연결 종료");
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // 메시지 전송
  const sendMessage = () => {
    if (input.trim() !== "") {
      const chatMessage = {
        id: uuidv4(), // 각 메시지에 고유 ID 부여
        senderId: userId,
        text: input,
        timestamp: new Date().toISOString(),
      };
      ws.current?.send(JSON.stringify(chatMessage));
      setInput("");
    }
  };

  // 한글 입력 중인지 체크하여 Enter 이벤트 방지
  const handleKeyDown = (e) => {
    if (!isComposing.current && e.key === "Enter" && input.trim() !== "") {
      e.preventDefault();
      sendMessage();
    }
  };

  // 📌 메시지가 추가될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">💬 실시간 채팅</h1>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-4 mb-4 overflow-y-auto h-96 border border-blue-500">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 p-2 rounded-xl ${
                msg.senderId === userId
                  ? "bg-blue-200 text-right"
                  : "bg-gray-200 text-left"
              }`}
            >
              <p className="text-sm text-gray-600">
                {msg.senderId === userId ? "나" : "상대방"}
              </p>
              <p className="font-medium">{msg.text}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">메시지가 없습니다.</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex w-full max-w-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={() => {
            isComposing.current = false;
          }}
          className="flex-grow p-2 rounded-l-2xl border-t border-l border-b focus:outline-none"
          placeholder="메시지를 입력하세요..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-r-2xl hover:bg-blue-600"
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default Chat;
