import { useCallback } from "react";
import { useSocket } from "../socket";

export function useAuthActions() {
  const { socket, storage, setUser } = useSocket();

  const loginUser = useCallback(
    async (userName, phoneNumber) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket is not connected"));
          return;
        }

        socket.emit("LOGIN", { userName, phoneNumber }, (response) => {
          if (response && response.success) {
            storage.setItem("userId", response.user.userId);
            storage.setItem("userName", userName);
            storage.setItem("phoneNumber", phoneNumber);
            setUser({ userId: response.user.userId, userName, phoneNumber });
          }
          resolve(response);
        });
      });
    },
    [socket, storage, setUser]
  );

  const register = useCallback(
    async (userName, phoneNumber) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket is not connected"));
          return;
        }

        socket.emit("REGISTER", { userName, phoneNumber }, (response) => {
          if (response && response.userId) {
            storage.setItem("userId", response.userId);
            setUser({ userId: response.userId, userName, phoneNumber });
            resolve(response);
          }
          resolve(response);
        });
      });
    },
    [socket, storage, setUser]
  );

  // Add the logout function
  const logoutUser = useCallback(() => {
    return new Promise((resolve, reject) => {
      const userId = storage.getItem("userId");
      if (!socket) {
        reject(new Error("Socket is not connected"));
        return;
      }

      socket.emit("LOGOUT", { userId }, (response) => {
        if (response && response.success) {
          storage.removeItem("userId");
          storage.removeItem("userName");
          storage.removeItem("phoneNumber");
          setUser(null); // Clear user from the context
          resolve(response);
        } else {
          reject(new Error(response.errMsg || "Logout failed"));
        }
      });
    });
  }, [socket, storage, setUser]);

  return { loginUser, register, logoutUser };
}
