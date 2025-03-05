import { BrowserRouter, Route, Routes } from "react-router-dom";

import Chat from "../chat/chat";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
