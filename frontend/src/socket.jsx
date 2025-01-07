import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;
console.log(BASE_URL);
// const storage =
//   process.env.NODE_ENV === "production" ? localStorage : sessionStorage;
const storage = sessionStorage;

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const socketIo = io.connect(BASE_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    // 소켓 연결 성공 시
    socketIo.on("connect", () => {
      console.log("Socket connected:", socketIo.id);
      setIsConnected(true);

      // 세션에서 저장된 유저 정보가 있으면 RECONNECT 이벤트를 발생시켜 세션 복원
      const storedUserId = storage.getItem("userId");
      const storedUserName = storage.getItem("userName");
      const storedPhoneNumber = storage.getItem("phoneNumber");

      if (storedUserId && storedUserName && storedPhoneNumber) {
        console.log("Sending RECONNECT event");
        socketIo.emit(
          "RECONNECT",
          { userName: storedUserName, phoneNumber: storedPhoneNumber },
          (response) => {
            if (response.success) {
              console.log("RECONNECT successful");
              setUser({
                userId: storedUserId,
                userName: storedUserName,
                phoneNumber: storedPhoneNumber,
              });
            } else {
              console.log("RECONNECT failed, removing user data");
              storage.removeItem("userId");
              storage.removeItem("userName");
              storage.removeItem("phoneNumber");
              setUser(null);
            }
          }
        );
      }
    });

    // 소켓 연결 해제 시 (서버와의 연결이 끊길 때)
    socketIo.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);

      // 연결이 끊겼을 때 세션을 초기화
      storage.removeItem("userId");
      storage.removeItem("userName");
      storage.removeItem("phoneNumber");
      console.log("Session storage cleared on disconnect.");
    });

    socketIo.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, storage, isConnected, user, setUser }}
    >
      {children}
    </SocketContext.Provider>
  );
};
