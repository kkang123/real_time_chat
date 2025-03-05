import { BrowserRouter, Route, Routes } from "react-router-dom";

import Chat from "../chat/chat";
import Nickname from "../user/nickname";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Nickname />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
