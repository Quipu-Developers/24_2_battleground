import { useCallback } from "react";
import { useSocket } from "../socket";

export function useLobbyActions() {
  const { socket, storage } = useSocket();

  const fetchRooms = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket is not connected"));

      socket.emit("GETROOMS", {}, (response) => {
        if (response.success) {
          resolve(response.rooms);
        } else {
          reject(new Error("Failed to fetch rooms"));
        }
      });
    });
  }, [socket, storage]);

  const createRoom = useCallback(
    async (roomName) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket is not connected"));
          return;
        }

        socket.emit("CREATEROOM", { roomName }, (response) => {
          if (response.room) {
            resolve(response.room);
          } else {
            reject(new Error("Failed to create room"));
          }
        });
      });
    },
    [socket, storage]
  );

  const enterRoom = useCallback(
    (roomId) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket is not connected"));
          return;
        }

        socket.emit("JOINROOM", { roomId }, (response) => {
          if (response.success) {
            resolve(response.users);
          } else {
            reject(new Error("Failed to enter room"));
          }
        });
      });
    },
    [socket, storage]
  );

  const deleteUserAccount = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("Socket is not connected"));
        return;
      }

      socket.emit("DELETEUSER", {}, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error("Failed to delete user account"));
        }
      });
    });
  }, [socket, storage]);

  return { fetchRooms, createRoom, enterRoom, deleteUserAccount };
}
