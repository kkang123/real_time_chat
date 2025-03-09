import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import useNicknameStore from "../store/chatStore"; // 닉네임 상태 가져오기

const WEBSOCKET_URL = "ws://localhost:8080"; // WebSocket 서버 주소

function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // 채팅 메시지 상태
  const [input, setInput] = useState(""); // 입력 필드 상태
  const [userId, setUserId] = useState(null); // 사용자 UUID를 서버로부터 받아와서 저장
  const [expiryTime, setExpiryTime] = useState(null); // UUID 만료 시간
  const [isSessionExpired, setIsSessionExpired] = useState(false); // 세션 만료 여부 상태 추가

  const ws = useRef(null); // WebSocket 인스턴스
  const isComposing = useRef(false); // 한글 조합 상태를 추적하기 위한 ref
  const messagesEndRef = useRef(null); // 스크롤 고정을 위한 ref
  const expiryCheckInterval = useRef(null); // 만료 시간 확인 인터벌

  const nickname = useNicknameStore((state) => state.nickname); // Zustand에서 닉네임 가져오기
  const setNickname = useNicknameStore((state) => state.setNickname);

  useEffect(() => {
    console.log("✅ 현재 저장된 닉네임:", nickname); // 추가된 디버깅 코드

    // 로컬 스토리지에서 닉네임 확인 (이미 chatStore에서 처리했지만 확실히 하기 위함)
    const savedNickname = localStorage.getItem("chatNickname");
    if (savedNickname && !nickname) {
      setNickname(savedNickname);
    }

    // 로컬 스토리지에서 사용자 정보 불러오기
    const savedUserId = localStorage.getItem("chatUserId");
    const savedExpiryTime = localStorage.getItem("chatExpiryTime");

    if (savedUserId && savedExpiryTime) {
      setUserId(savedUserId);
      setExpiryTime(savedExpiryTime);

      // 만료 여부 확인
      checkExpiry();
    }
  }, []);

  // 만료 시간 확인 함수
  const checkExpiry = useCallback(() => {
    if (!expiryTime) return;

    const now = new Date();
    const expiry = new Date(expiryTime);

    if (now > expiry) {
      // 만료된 경우
      setIsSessionExpired(true); // 세션 만료 상태 업데이트
      alert("채팅 세션이 만료되었습니다. 메인 페이지로 이동합니다.");
      localStorage.removeItem("chatUserId");
      localStorage.removeItem("chatExpiryTime");
      localStorage.removeItem("chatNickname");

      navigate("/");
    } else {
      setIsSessionExpired(false); // 세션이 유효한 경우
    }
  }, [expiryTime, navigate]);

  // 주기적으로 만료 시간 확인
  useEffect(() => {
    expiryCheckInterval.current = setInterval(checkExpiry, 10000); // 10초마다 확인

    return () => {
      if (expiryCheckInterval.current) {
        clearInterval(expiryCheckInterval.current);
      }
    };
  }, [expiryTime, checkExpiry]);

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
          setExpiryTime(data.expiryTime); // 만료 시간 저장
          setIsSessionExpired(false); // 새 세션 ID를 받았으므로 만료 상태 리셋

          // 로컬 스토리지에 사용자 정보 저장
          localStorage.setItem("chatUserId", data.userId);
          localStorage.setItem("chatExpiryTime", data.expiryTime);

          console.log("🆔 서버에서 받은 userId:", data.userId);
          console.log("⏰ 만료 시간:", data.expiryTime);
          return;
        }

        // 만료 메시지 처리
        if (data.type === "expired") {
          setIsSessionExpired(true); // 세션 만료 상태 업데이트
          alert(data.message);
          localStorage.removeItem("chatUserId");
          localStorage.removeItem("chatExpiryTime");
          window.location.href = "/";
          return;
        }

        // 만료 시간 갱신 메시지 처리
        if (data.type === "expiryUpdate") {
          setExpiryTime(data.expiryTime);
          setIsSessionExpired(false); // 만료 시간이 갱신되었으므로 만료 상태 리셋
          localStorage.setItem("chatExpiryTime", data.expiryTime);
          console.log("⏰ 갱신된 만료 시간:", data.expiryTime);
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
    if (input.trim() !== "" && !isButtonDisabled) {
      // 전송 전 만료 확인
      checkExpiry();

      const chatMessage = {
        id: uuidv4(), // 각 메시지에 고유 ID 부여
        senderId: userId,
        senderName: nickname, // 닉네임 추가
        text: input,
        timestamp: new Date().toISOString(),
        updateExpiry: true, // 만료 시간 갱신 요청 플래그 추가
      };
      ws.current?.send(JSON.stringify(chatMessage));
      setInput("");
    }
  };

  // 한글 입력 중인지 체크하여 Enter 이벤트 방지
  const handleKeyDown = (e) => {
    if (
      !isComposing.current &&
      e.key === "Enter" &&
      input.trim() !== "" &&
      !isButtonDisabled
    ) {
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

  // 만료 시간 표시 및 확인 컴포넌트
  const ExpiryTimer = () => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      if (!expiryTime) return;

      const updateTime = () => {
        const now = new Date();
        const expiry = new Date(expiryTime);
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeLeft("만료됨");
          setIsExpired(true);
        } else {
          const seconds = Math.floor(diff / 1000);
          setTimeLeft(`${Math.floor(seconds / 60)}분 ${seconds % 60}초`);
          setIsExpired(false);
        }
      };

      // 초기 시간 설정
      updateTime();

      const timer = setInterval(updateTime, 1000);

      return () => clearInterval(timer);
    }, []);

    // expiryTime이 바뀔 때마다 실행되는 효과
    useEffect(() => {
      if (!expiryTime) return;

      const now = new Date();
      const expiry = new Date(expiryTime);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("만료됨");
        setIsExpired(true);
        setIsSessionExpired(true); // 부모 컴포넌트의 만료 상태도 업데이트
      } else {
        const seconds = Math.floor(diff / 1000);
        setTimeLeft(`${Math.floor(seconds / 60)}분 ${seconds % 60}초`);
        setIsExpired(false);
        setIsSessionExpired(false); // 부모 컴포넌트의 만료 상태도 업데이트
      }
    }, [expiryTime]);

    return expiryTime ? (
      <div className="text-sm text-gray-600 mb-2">
        세션 만료까지:{" "}
        <span
          className={`font-medium ${
            isExpired ? "text-red-500" : "text-blue-500"
          }`}
        >
          {timeLeft}
        </span>
      </div>
    ) : null;
  };

  // 버튼 비활성화 조건 체크
  const isButtonDisabled = !nickname || isSessionExpired || !userId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">💬 실시간 채팅</h1>

      {expiryTime && <ExpiryTimer />}

      {!nickname && (
        <div className="w-full max-w-md mb-2 p-2 bg-yellow-100 text-yellow-800 rounded-lg">
          닉네임이 설정되지 않았습니다. 채팅을 시작하려면 닉네임을 설정해주세요.
        </div>
      )}

      {isSessionExpired && (
        <div className="w-full max-w-md mb-2 p-2 bg-red-100 text-red-800 rounded-lg">
          세션이 만료되었습니다. 페이지를 새로고침하여 다시 시작하세요.
        </div>
      )}

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
          disabled={isButtonDisabled}
        />
        <button
          onClick={sendMessage}
          className={`p-2 rounded-r-2xl ${
            isButtonDisabled
              ? "bg-gray-400 text-gray-100 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          disabled={isButtonDisabled}
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default Chat;
