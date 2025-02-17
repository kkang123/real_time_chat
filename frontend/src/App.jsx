import { useEffect, useState, useRef } from "react";

const WEBSOCKET_URL = "ws://localhost:8080"; // WebSocket 서버 주소

function App() {
  const [messages, setMessages] = useState([]); // 채팅 메시지 상태
  const [input, setInput] = useState(""); // 입력 필드 상태
  const ws = useRef(null); // WebSocket 인스턴스
  // useRef는 WebSocket 연결 객체와 같이 컴포넌트 라이프사이클 동안 유지되어야 하지만 렌더링에 영향을 주지 않는 값을 관리할 때 사용
  // 컴포넌트가 렌더링될 때마다 새 연결을 만들면 중복 연결이 발생합니다.
  // useRef를 사용하면 연결 객체가 초기화되지 않고 유지되므로
  // 한 번 연결된 WebSocket을 계속 사용할 수 있습니다.
  // null인 이유는 초기에는 객체가 존재하지 않기 때문
  const messagesEndRef = useRef(null); // 스크롤 고정을 위한 ref

  // WebSocket 연결
  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("✅ WebSocket 연결 성공");
    };

    ws.current.onmessage = (event) => {
      const newMessage = event.data;
      setMessages((prev) => [...prev, newMessage]);
    };

    ws.current.onclose = () => {
      console.log("❌ WebSocket 연결 종료");
    };

    return () => {
      ws.current.close(); // 컴포넌트 언마운트 시 연결 종료
    };
  }, []);

  // 메시지 전송
  const sendMessage = () => {
    if (input.trim() !== "") {
      console.log("입력 메시지:", input); // 입력값 확인
      ws.current.send(input); // WebSocket으로 메세지 전송
      setMessages((prev) => [...prev, input]); // 메시지 배열에 추가
      console.log("업데이트된 메시지 배열:", [...messages, input]); // 상태 업데이트 확인
      setInput(""); // 입력 필드 초기화
    }
  };

  // 📌 메시지가 추가될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">💬 실시간 채팅</h1>

      {/* <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-4 mb-4 overflow-y-auto h-96 border-blue-500 border-2">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <span className="block p-2 bg-blue-200 rounded-xl">{msg}</span>
          </div>
        ))}
      </div> */}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-4 mb-4 overflow-y-auto h-96 border-blue-500 border-2">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <span className="block p-2 bg-blue-200 rounded-xl">{msg}</span>
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
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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

export default App;
