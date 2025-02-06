// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { useEffect, useState } from "react";

const socket = new WebSocket("ws://localhost:8080");

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      socket.send(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-4 shadow-md rounded-md w-80">
        <h2 className="text-lg font-bold mb-2">실시간 채팅</h2>
        <div className="h-40 overflow-auto border p-2 mb-2">
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-1 w-full"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white w-full mt-2 p-1"
        >
          전송
        </button>
      </div>
    </div>
  );
}
