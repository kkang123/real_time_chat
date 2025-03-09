import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useNicknameStore from "../store/chatStore";

function Nickname() {
  const [input, setInput] = useState("");
  const setNickname = useNicknameStore((state) => state.setNickname);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (input.trim() !== "") {
      setNickname(input);
      console.log(input);
      navigate("/chat"); // 채팅 페이지로 이동
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">닉네임 설정</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="p-2 border rounded"
        placeholder="닉네임 입력"
      />
      <button
        onClick={handleSubmit}
        className="mt-2 p-2 bg-blue-500 text-white rounded"
      >
        입장하기
      </button>
    </div>
  );
}

export default Nickname;
