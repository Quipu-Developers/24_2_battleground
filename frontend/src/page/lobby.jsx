import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLobbyActions } from "../service/lobby_service";
import { useSocket } from "../socket";
import { useAuthActions } from "../service/login_service";
import "../style/lobby.css";

export default function Lobby() {
  const { fetchRooms, createRoom, enterRoom } = useLobbyActions();
  const { logoutUser } = useAuthActions();
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const navigate = useNavigate();
  const { user, socket, storage, isConnected } = useSocket();
  const userName = storage.getItem("userName");
  const phoneNumber = storage.getItem("phoneNumber");

  useEffect(() => {
    const loadRooms = async () => {
      if (isConnected) {
        try {
          const room_list = await fetchRooms();
          setRooms(room_list);
        } catch (error) {
          console.error("방 목록을 가져오는 중 오류 발생:", error);
        }
      }
    };

    loadRooms();

    // 소켓 이벤트 리스너 등록
    if (socket && isConnected) {
      socket.on("CREATEROOM", loadRooms);
      socket.on("DELETEROOM", loadRooms);
      socket.on("STARTGAME", loadRooms);
      socket.on("JOINUSER", loadRooms);
      socket.on("LEAVEUSER", loadRooms);
    }

    return () => {
      if (socket) {
        socket.off("CREATEROOM", loadRooms);
        socket.off("DELETEROOM", loadRooms);
        socket.off("STARTGAME", loadRooms);
        socket.off("JOINUSER", loadRooms);
        socket.off("LEAVEUSER", loadRooms);
      }
    };
  }, [socket, isConnected, fetchRooms]);

  const handleRoomCreate = () => {
    setShowForm(true);
  };

  const handleRoomNameChange = (event) => {
    setRoomName(event.target.value);
  };

  const handleRoomSubmit = async (event) => {
    event.preventDefault();
    if (roomName.trim() !== "" && isConnected) {
      try {
        const room = await createRoom(roomName);
        navigate("/waiting-room", {
          state: {
            roomId: room.roomId,
            roomName: room.roomName,
            users: room.users,
          },
        });
      } catch (error) {
        console.error("방 생성 중 오류 발생:", error);
      }
    }
  };

  const handleEnterRoom = async (length, roomId, roomName) => {
    if (length >= 3) {
      alert("방이 모두 차 입장할 수 없습니다.");
      return;
    }
    if (isConnected) {
      try {
        const users = await enterRoom(roomId);
        navigate("/waiting-room", {
          state: {
            roomId: roomId,
            roomName: roomName,
            userName: user?.userName,
            phoneNumber: user?.phoneNumber,
            users: users,
          },
        });
      } catch (error) {
        console.error("방 입장 중 오류 발생:", error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  // const handleDeleteClick = () => {
  //   setShowConfirmDelete(true);
  // };

  // const handleConfirmDelete = async () => {
  //   try {
  //     await deleteUserAccount(); // Call the logoutUser function to log out the user
  //     navigate("/"); // Redirect to the home page after logout
  //   } catch (error) {
  //     console.error("탈퇴 실패:", error.message);
  //   }
  //   setShowConfirmDelete(false);
  // };

  const handleLogoutClick = async () => {
    try {
      await logoutUser(); // Call the logoutUser function to log out the user
      navigate("/"); // Redirect to the home page after logout
    } catch (error) {
      console.error("로그아웃 실패:", error.message);
    }
  };

  const handleShowRules = () => {
    setShowRulesModal(true);
  };

  const handleCloseRules = () => {
    setShowRulesModal(false);
  };

  return (
    <div className="lb_container">
      <div className="lb_sidebar">
        <div className="lb_sidebar_top">
          <div className="lb_sidebar_profile">
            <img src={process.env.PUBLIC_URL + "/image/irumaelb.png"} alt="irumaelb" />
          </div>
          <div className="lb_sidebar_nn">
            <div className="lb_sidebar_name">{userName}</div>
            <div className="lb_sidebar_num">{phoneNumber}</div>
          </div>
          <div className="lb_sidebar_logout">
            <button className="lb_rule" onClick={handleShowRules}>
              게임 규칙
            </button>
            <button className="lb_sidebar_logout_button" onClick={handleLogoutClick}>
              로그아웃
            </button>
          </div>
        </div>
        <div className="lb_botcontainer">
          <button className="lb_roomMake" onClick={handleRoomCreate}>
            방 만들기
          </button>
        </div>
      </div>

      <div className="lb_titlecontainer">배틀글라운드</div>
      <div className="lb_topcontainer">
        {rooms.length === 0 ? (
          <div className="lb_no_rooms_message">(&ensp; 방이 하나도 없어요 . . . 😢😢&ensp;)</div>
        ) : (
          <div className="lb_roomlist">
            {rooms.map((room, index) => (
              <div key={index} className="lb_roombox">
                <div className="lb_roombox_num">{room.users.length}/3</div>
                <div className="lb_roombox_title">{room.roomName}</div>
                <div className="lb_roombox_bottom">
                  <div className="lb_roombox_started">{room.started ? "게임 중" : "준비 중"}</div>
                  <div className="lb_roombox_admin">
                    👑&nbsp;
                    {room.users.find((user) => user.power === "leader")?.userName}
                  </div>
                </div>
                <button
                  className="lb_submit"
                  onClick={() => handleEnterRoom(room.users.length, room.roomId, room.roomName)}
                >
                  입장하기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="lb_formcontainer">
          <button className="lb_closeButton" onClick={handleCloseForm}>
            X
          </button>
          <form onSubmit={handleRoomSubmit}>
            <div className="lb_inputgroup">
              <label>방 이름 :</label>
              <input
                className="lb_roomname"
                id="roomName"
                value={roomName}
                onChange={handleRoomNameChange}
              />
            </div>
            <button className="lb_submit" type="submit">
              방 만들기
            </button>
          </form>
        </div>
      )}

      {/* 게임 규칙 모달 */}
      {showRulesModal && (
        <div className="lb_rules_modal">
          <div className="lb_rule_content">
            <button className="lb_closeButton" onClick={handleCloseRules}>
              X
            </button>
            <h3>게임 규칙</h3>
            <ul>
              <li>
                화면에 쏟아지는 단어들을 노리는 <span className="highlight">1</span>분간의 치열한
                격전!
              </li>
              <li>
                놓친 단어는 <span className="highlight">라이벌</span>의 것!{" "}
                <span className="lowlight">스피드</span>와 <span className="lowlight">전략</span>은
                모두 필수!
              </li>
              <li>
                60초 동안 당신의 <span className="lowlightt">타이핑</span> 실력과{" "}
                <span className="highlightt">눈치</span> 게임의 조화로
                <br />
                <span className="highlight">🏆Top 10🏆</span>에 도전하세요!
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
