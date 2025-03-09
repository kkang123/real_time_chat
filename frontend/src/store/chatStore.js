import { create } from "zustand";

const useNicknameStore = create((set) => ({
  nickname: localStorage.getItem("chatNickname") || "", // 로컬 스토리지에서 닉네임 가져오기
  setNickname: (newNickname) => {
    localStorage.setItem("chatNickname", newNickname); // 로컬 스토리지에 닉네임 저장
    set({ nickname: newNickname });
  },
}));

export default useNicknameStore;
