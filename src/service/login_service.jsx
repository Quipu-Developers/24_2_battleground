import { useCallback } from "react";
import { useSocket } from "../socket";

export function useAuthActions() {
  const socket = useSocket();

  const loginUser = useCallback(
    async (userName, phoneNumber) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket is not connected"));
          return;
        }

        socket.emit("LOGIN", { userName, phoneNumber }, (response) => {
          if (response && response.userId) {
            localStorage.setItem("userId", response.userId);
            resolve(response.userId);
          } else {
            reject(new Error("Failed to login user"));
          }
        });
      });
    },
    [socket]
  );

  return { loginUser };
}
