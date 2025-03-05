import { create } from "zustand";

const useNicknameStore = create((set) => ({
  nickname: "",
  setNickname: (name) => set({ nickname: name }),
}));

export default useNicknameStore;
