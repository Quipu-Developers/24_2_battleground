import { useCallback } from "react";
import { useSocket } from "../socket";

export function useGameActions() {
  const { socket } = useSocket();

  const wordInput = useCallback(
    async (word) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket is not connected"));
          return;
        }

        socket.emit("WORD", { word }, (response) => {
          if (response.success) {
            console.log("Word submitted successfully");
            resolve(response);
          } else {
            console.error("Failed to submit word");
            reject(new Error("Failed to submit word"));
          }
        });
      });
    },
    [socket]
  );

  return { wordInput };
}
