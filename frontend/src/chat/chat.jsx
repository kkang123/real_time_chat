import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import useNicknameStore from "../store/chatStore"; // 닉네임 상태 가져오기

const WEBSOCKET_URL = "ws://localhost:8080"; // WebSocket 서버 주소

function Chat() {
  const [messages, setMessages] = useState([]); // 채팅 메시지 상태
  const [input, setInput] = useState(""); // 입력 필드 상태
  const [userId, setUserId] = useState(null); // 사용자 UUID를 서버로부터 받아와서 저장
  const ws = useRef(null); // WebSocket 인스턴스
  const isComposing = useRef(false); // 한글 조합 상태를 추적하기 위한 ref
  const messagesEndRef = useRef(null); // 스크롤 고정을 위한 ref

  const nickname = useNicknameStore((state) => state.nickname); // Zustand에서 닉네임 가져오기

  useEffect(() => {
    console.log("✅ 현재 저장된 닉네임:", nickname); // 추가된 디버깅 코드
  }, []);

  // WebSocket 연결
  useEffect(() => {
    if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
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
    }

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
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
        senderName: nickname, // 닉네임 추가
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
              <p className="text-sm text-gray-600">{msg.senderName}</p>

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

// import { useEffect, useState, useRef, useCallback } from "react";
// import { v4 as uuidv4 } from "uuid";
// import { useNavigate } from "react-router-dom"; // 페이지 이동을 위해 추가
// import useNicknameStore from "../store/chatStore"; // 닉네임 상태 가져오기

// const WEBSOCKET_URL = "ws://localhost:8080";

// function Chat() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [userId, setUserId] = useState(null);
//   const ws = useRef(null);
//   const isComposing = useRef(false);
//   const messagesEndRef = useRef(null);
//   const navigate = useNavigate(); // 페이지 이동을 위한 hook
//   const [connected, setConnected] = useState(false);
//   const reconnectTimerRef = useRef(null);

//   const nickname = useNicknameStore((state) => state.nickname);

//   useEffect(() => {
//     console.log("✅ 현재 저장된 닉네임:", nickname);

//     if (!nickname) {
//       navigate("/"); // 닉네임이 없으면 설정 페이지로 이동
//       return;
//     }

//     // 📌 로컬스토리지에서 UUID와 만료시간 확인
//     const storedUserId = localStorage.getItem("userId");
//     const storedExpireTime = localStorage.getItem("uuidExpireTime");

//     const now = Date.now();

//     // UUID가 없거나 만료된 경우 처리
//     if (!storedUserId || !storedExpireTime || now > Number(storedExpireTime)) {
//       // 유효기간이 지난 경우 로컬 스토리지에서 제거
//       if (storedUserId) {
//         localStorage.removeItem("userId");
//         localStorage.removeItem("uuidExpireTime");
//       }
//       // 새 연결 시 서버가 UUID를 할당할 것임
//     } else {
//       // 유효한 UUID가 있는 경우 설정
//       setUserId(storedUserId);
//     }
//   }, [navigate, nickname]);

//   // WebSocket 연결 함수
//   const connectWebSocket = useCallback(() => {
//     // 기존 연결이 있으면 정리
//     if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
//       ws.current.close();
//     }

//     // WebSocket 연결
//     ws.current = new WebSocket(WEBSOCKET_URL);

//     ws.current.onopen = () => {
//       console.log("✅ WebSocket 연결 성공");
//       setConnected(true);

//       // 재연결 타이머가 있다면 제거
//       if (reconnectTimerRef.current) {
//         clearTimeout(reconnectTimerRef.current);
//         reconnectTimerRef.current = null;
//       }
//     };

//     ws.current.onmessage = (event) => {
//       const data = JSON.parse(event.data);

//       if (data.type === "assignId") {
//         setUserId(data.userId);
//         localStorage.setItem("userId", data.userId);
//         localStorage.setItem("uuidExpireTime", Date.now() + 10 * 60 * 1000); // 10분 후 만료
//         console.log("🆔 서버에서 받은 userId:", data.userId);
//         return;
//       }

//       setMessages((prev) => [...prev, data]);
//     };

//     ws.current.onclose = () => {
//       console.log("❌ WebSocket 연결 종료");
//       setConnected(false);

//       // 5초 후 재연결 시도
//       reconnectTimerRef.current = setTimeout(() => {
//         console.log("🔄 WebSocket 재연결 시도...");
//         connectWebSocket();
//       }, 5000);
//     };

//     ws.current.onerror = (event) => {
//       console.error("⚠️ WebSocket 오류 발생!", event);

//       if (ws.current) {
//         console.log("📌 WebSocket 상태 코드:", ws.current.readyState);
//         console.log("📌 연결 URL:", ws.current.url);
//       }

//       if (ws.current?.readyState === WebSocket.CLOSED) {
//         console.log("❌ WebSocket이 닫혔습니다. 5초 후 재연결합니다.");
//         setTimeout(connectWebSocket, 5000);
//       }
//     };
//   }, []);

//   // 초기 WebSocket 연결
//   useEffect(() => {
//     connectWebSocket();

//     return () => {
//       if (ws.current) {
//         ws.current.close();
//       }

//       if (reconnectTimerRef.current) {
//         clearTimeout(reconnectTimerRef.current);
//       }
//     };
//   }, [connectWebSocket]);

//   // UUID 만료 시간 주기적 갱신 (활동 중인 경우)
//   useEffect(() => {
//     const refreshUuidExpiration = () => {
//       const storedUserId = localStorage.getItem("userId");
//       if (storedUserId) {
//         localStorage.setItem(
//           "uuidExpireTime",
//           String(Date.now() + 10 * 60 * 1000)
//         );
//       }
//     };

//     // 5분마다 UUID 만료 시간 갱신
//     const interval = setInterval(refreshUuidExpiration, 5 * 60 * 1000);

//     return () => clearInterval(interval);
//   }, []);

//   const sendMessage = () => {
//     if (!connected) {
//       console.log("⚠️ WebSocket 연결이 없습니다. 재연결 시도 중...");
//       connectWebSocket();
//       return;
//     }

//     if (input.trim() !== "" && userId) {
//       const chatMessage = {
//         id: uuidv4(),
//         senderId: userId,
//         senderName: nickname,
//         text: input,
//         timestamp: new Date().toISOString(),
//       };

//       try {
//         ws.current?.send(JSON.stringify(chatMessage));
//         setInput("");
//       } catch (error) {
//         console.error("⚠️ 메시지 전송 오류:", error);
//       }
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (!isComposing.current && e.key === "Enter" && input.trim() !== "") {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
//       <h1 className="text-2xl font-bold mb-4">💬 실시간 채팅</h1>

//       <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-4 mb-4 overflow-y-auto h-96 border border-blue-500">
//         {messages.length > 0 ? (
//           messages.map((msg) => (
//             <div
//               key={msg.id}
//               className={`mb-2 p-2 rounded-xl ${
//                 msg.senderId === userId
//                   ? "bg-blue-200 text-right"
//                   : "bg-gray-200 text-left"
//               }`}
//             >
//               <p className="text-sm text-gray-600">{msg.senderName}</p>
//               <p className="font-medium">{msg.text}</p>
//             </div>
//           ))
//         ) : (
//           <p className="text-center text-gray-500">메시지가 없습니다.</p>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="flex w-full max-w-md">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={handleKeyDown}
//           onCompositionStart={() => {
//             isComposing.current = true;
//           }}
//           onCompositionEnd={() => {
//             isComposing.current = false;
//           }}
//           className="flex-grow p-2 rounded-l-2xl border-t border-l border-b focus:outline-none"
//           placeholder="메시지를 입력하세요..."
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-blue-500 text-white p-2 rounded-r-2xl hover:bg-blue-600"
//         >
//           전송
//         </button>
//       </div>
//     </div>
//   );
// }

// export default Chat;
