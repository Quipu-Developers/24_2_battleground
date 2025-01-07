import "../style/waitingRoom.css";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWaitingRoomActions } from "../service/waitingRoom_service";
import { useSocket } from "../socket";

export default function WaitingRoom() {
  const location = useLocation();
  const { roomId, roomName, users } = location.state || {};
  const { leaveRoom, deleteRoom } = useWaitingRoomActions();
  const [inputValue, setInputValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const navigate = useNavigate();
  const { socket, user, storage, isConnected } = useSocket();
  const [chats, setChats] = useState(() => {
    const storedChats = storage.getItem(`chats_${roomId}`);
    return storedChats ? JSON.parse(storedChats) : [];
  });

  const [players, setPlayers] = useState(() => {
    const storedPlayers = storage.getItem(`players_${roomId}`);
    return storedPlayers ? JSON.parse(storedPlayers) : users;
  });

  const leader = players.find((player) => player.power === "leader");

  const getJoinUser = useCallback(
    (newUser) => {
      setPlayers((prevPlayers) => {
        const isUserAlreadyInRoom = prevPlayers.some(
          (player) => player.userId === newUser.user.userId
        );
        if (isUserAlreadyInRoom) {
          return prevPlayers;
        }
        const updatedPlayers = [...prevPlayers, newUser.user];
        storage.setItem(`players_${roomId}`, JSON.stringify(updatedPlayers));
        return updatedPlayers;
      });
    },
    [roomId, storage]
  );

  const getReconnectUser = useCallback(
    (reconnectedUser) => {
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.map((player) =>
          player.userId === reconnectedUser.userId ? reconnectedUser : player
        );
        storage.setItem(`players_${roomId}`, JSON.stringify(updatedPlayers));
        return updatedPlayers;
      });
    },
    [roomId, storage]
  );

  const getChatMessage = useCallback(
    ({ userName, message }) => {
      setChats((prevChats) => {
        const updatedChats = [...prevChats, { userName, message }];
        storage.setItem(`chats_${roomId}`, JSON.stringify(updatedChats));
        return updatedChats;
      });
    },
    [roomId, storage]
  );

  const getDeleteRoom = useCallback(() => {
    alert("방이 삭제되었습니다.");
    navigate("/lobby");
  }, [navigate]);

  const removeUser = useCallback(
    (response) => {
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.filter(
          (player) => player.userId !== response.user.userId
        );
        storage.setItem(`players_${roomId}`, JSON.stringify(updatedPlayers));
        return updatedPlayers;
      });
    },
    [roomId, storage]
  );

  const getStartGame = useCallback(
    ({ gameInfo }) => {
      console.log(gameInfo);
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(interval);
            navigate("/game", {
              state: {
                words: gameInfo.words,
                users: gameInfo.users,
              },
            });
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    },
    [navigate]
  );

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const removeAllListeners = () => {
      socket.off("JOINUSER", getJoinUser);
      socket.off("RECONNECT", getReconnectUser);
      socket.off("CHAT", getChatMessage);
      socket.off("DELETEROOM", getDeleteRoom);
      socket.off("LEAVEUSER", removeUser);
      socket.off("STARTGAME", getStartGame);
    };

    const setupSocketListeners = () => {
      console.log("eventListener on");
      removeAllListeners();
      socket.on("JOINUSER", getJoinUser);
      socket.on("RECONNECT", getReconnectUser);
      socket.on("CHAT", getChatMessage);
      socket.on("DELETEROOM", getDeleteRoom);
      socket.on("LEAVEUSER", removeUser);
      socket.on("STARTGAME", getStartGame);
    };

    console.log("Setting up listeners");
    setupSocketListeners();

    return () => {
      removeAllListeners();
    };
  }, [
    socket,
    isConnected,
    roomId,
    user,
    getJoinUser,
    getReconnectUser,
    getChatMessage,
    getDeleteRoom,
    removeUser,
    getStartGame,
  ]);

  const addChatMessage = (userName, chatMessage) => {
    setChats((prevChats) => {
      const updatedChats = [...prevChats, { userName, message: chatMessage }];
      storage.setItem(`chats_${roomId}`, JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  const handleSendMessage = () => {
    try {
      const chatPacket = { message: inputValue };
      addChatMessage("나", inputValue);

      socket.emit("CHAT", chatPacket, (response) => {
        if (!response.success) {
          console.error("Failed to send message.", response.errMsg);
        }
      });

      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error.message);
    }
  };

  const handleStartGame = async () => {
    try {
      socket.emit("STARTGAME", {}, (response) => {
        if (!response.success) {
          console.error("Failed to start game.");
        }
      });
    } catch (error) {
      console.error("Failed to start game:", error.message);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await deleteRoom();
      alert("방이 삭제되었습니다.");
      navigate("/lobby");
    } catch (error) {
      console.error("Failed to delete room", error.message);
    }
  };

  const handleBack = async () => {
    try {
      await leaveRoom();
      alert("로비로 이동합니다.");
      navigate("/lobby");
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isComposing) {
      handleSendMessage();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  return (
    <div className="wr_container">
      {String(leader?.userId) !== String(user?.userId) && (
        <div className="wr_back" onClick={handleBack} />
      )}
      {String(leader?.userId) === String(user?.userId) && (
        <button className="wr_delete" onClick={handleDeleteRoom}>
          방 삭제하기
        </button>
      )}
      {countdown > 0 && <div className="wr_countdown">{countdown}</div>}
      <div className="wr_topcontainer">
        <div className="wr_title">{roomName}</div>
      </div>
      <div className="wr_leftcontainer">
        {players.map((player, index) => (
          <div key={index} className="wr_player1">
            <div className="wr_player1_top">
              <p>{player.userName}</p>
            </div>
            <img
              src={process.env.PUBLIC_URL + `/image/irumae${index + 1}.png`}
              alt="profile"
            />
            {player.power === "leader" && (
              <div className="wr_player1_bot">방장</div>
            )}
          </div>
        ))}
        <div className="wr_bottom">
          <div className="wr_bottom_left">
            <img
              src={process.env.PUBLIC_URL + "/image/person.png"}
              alt="person"
            />
            <div className="wr_bottom_left_num">{players.length}</div>
            <p>/3</p>
          </div>

          {String(leader?.userId) === String(user?.userId) && (
            <div
              className={`wr_bottom_start ${
                players.length !== 3 ? "disabled" : ""
              }`}
              onClick={players.length === 3 ? handleStartGame : null}
              style={{
                backgroundColor: players.length === 3 ? "#28a745" : "#ccc",
                cursor: players.length === 3 ? "pointer" : "not-allowed",
              }}
            >
              게임 시작
            </div>
          )}
        </div>
      </div>
      <div className="wr_rightcontainer">
        <div className="wr_chatbox">
          {chats
            .slice()
            .reverse()
            .map((chat, index) => (
              <div key={index} className="wr_chatMessage">
                <strong>{chat.userName}:</strong> {chat.message}
              </div>
            ))}
        </div>
        <div className="wr_inputContainer">
          <input
            className="wr_input"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
          <button onClick={handleSendMessage} className="wr_send">
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
