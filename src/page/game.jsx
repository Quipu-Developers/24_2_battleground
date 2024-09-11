import "../style/game.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameActions } from "../service/game_service";
import { useSocket } from "../socket";

export default function Game() {
  const { socket, storage } = useSocket();
  const location = useLocation();
  const { roomId, roomName, words } = location.state || {};
  const userName = storage.getItem("userName");
  const { wordInput } = useGameActions();
  const [inputValue, setInputValue] = useState("");
  const [gameInfo, setGameInfo] = useState([]);
  const [selectedImage, setSelectedImage] = useState(
    <img src="image/irumae_happy.png" alt="profile" />
  );
  const [isTimeout, setIsTimeout] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();
  const [hiddenWords, setHiddenWords] = useState([]);
  // const [showTimeLeftMessage, setShowTimeLeftMessage] = useState(false);
  const showTimeLeftMessage = false;
  const inputRef = useRef(null);
  const [count, setCount] = useState(60);
  const [idleTimeout, setIdleTimeout] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const getWord = ({ userId, success, word, gameInfo }) => {
      console.log("전달받은 단어: ", word);
      console.log(gameInfo);
      setGameInfo(gameInfo);
    };

    const setupSocketListeners = () => {
      socket.on("WORD", getWord);
    };

    if (socket.connected) {
      setupSocketListeners();
    } else {
      socket.connect();
      socket.once("connect", setupSocketListeners);
    }
  }, [socket]);

  // 단어 제출 처리 함수
  async function handleSubmitWord(inputWord) {
    const word = inputWord.trim();

    try {
      const response = await wordInput(word);
      if (response.success) {
        console.log("Word processed successfully:", response);
      }
    } catch (error) {
      console.error("Error submitting word:", error.message);
    }
  }

  // 타이머 만료 시 처리 함수
  const handleIdleTimeout = useCallback(() => {
    navigate("/end");
  }, []);

  // 타이머 해제 함수
  const clearIdleTimer = useCallback(() => {
    if (idleTimeout) {
      clearTimeout(idleTimeout);
    }
  }, [idleTimeout]);

  // 타이머 초기화 및 설정 함수
  const resetIdleTimer = useCallback(() => {
    clearIdleTimer(); // 기존 타이머 해제
    setIdleTimeout(setTimeout(handleIdleTimeout, 600000)); // 10초 후 게임 종료 타이머 설정
  }, []);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    resetIdleTimer(); // 키 입력 시 타이머 리셋
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Enter") {
      const trimmedInput = inputValue.trim();
      if (words.includes(trimmedInput)) {
        setSelectedImage(<img src="image/irumae_happy.png" alt="profile" />);
        setHiddenWords([...hiddenWords, trimmedInput]);
        setIsValid(false);

        // 서버로 단어 제출
        await handleSubmitWord(trimmedInput);
      } else {
        setSelectedImage(<img src="image/irumae_sad.png" alt="profile" />);
        setIsValid(true);
        console.log("틀림");
      }

      setTimeout(() => {
        setIsValid(false);
      }, 300); // 1초 후에 isValid를 false로 설정

      setInputValue("");
      resetIdleTimer(); // 타이머 리셋
    }
  };

  // 화면 렌더링 시 바로 inputbox에 입력 기능
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    resetIdleTimer(); // 추가된 부분: 컴포넌트가 마운트될 때 타이머 설정

    return () => clearIdleTimer(); // 컴포넌트가 언마운트될 때 타이머 해제
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((count) => count - 1);
      if (count <= 11 && count > 0) {
        setIsTimeout(true);
        setTimeout(() => {
          setIsTimeout(false);
        }, 200);
      }
    }, 1000);
    if (count === 0) {
      clearInterval(id);
    }
    return () => clearInterval(id);
  }, [count]);

  return (
    <div
      className="container"
      style={{
        boxShadow: isTimeout ? "inset 0 0 3vh rgba(255, 0, 0, 1)" : "none",
      }}
    >
      {isTimeout && <div className="overlay"></div>}
      <div className="leftcontainer">
        <div className="profile">{selectedImage}</div>
        <div className="profile_name">{userName}</div>
        <div className="profile_timer">
          <img className="timer" src="/image/timer.png" alt="timer" />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{count}
        </div>
        <div className="ranking">
          <div className="ranking_number">3</div>
        </div>
        <div className="rankbox">
          <div className="rankbox_title">실시간 순위</div>
          <div className="rankbox_first">
            <div className="rankbox_num">1등</div>
            <div style={{ width: "70%" }}>
              <p
                style={{
                  background:
                    "linear-gradient(to right, #D1A722 -10%, transparent)",
                }}
              >
                {gameInfo.users[0].userName} {gameInfo.users[0].score}점
              </p>
            </div>
          </div>
          <div className="rankbox_second">
            <div className="rankbox_num">2등</div>
            <div style={{ width: "65%" }}>
              <p
                style={{
                  background:
                    "linear-gradient(to right, #b1abab -10%, transparent)",
                }}
              >
                {gameInfo.users[1].userName} {gameInfo.users[1].score}점
              </p>
            </div>
          </div>
          <div className="rankbox_third">
            <div className="rankbox_num">3등</div>
            <div style={{ width: "60%" }}>
              <p
                style={{
                  background:
                    "linear-gradient(to right, #836b2e -10%, transparent)",
                }}
              >
                {gameInfo.users[2].userName} {gameInfo.users[2].score}점
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="rightcontainer">
        <div className="wordbox">
          {showTimeLeftMessage && (
            <div className="time-left-message">
              <img src="/image/alert.png" alt="alert" />
            </div>
          )}
          {words.map((word, index) => (
            <div
              key={index}
              className={hiddenWords.includes(word) ? "hidden-word" : ""}
            >
              <u className="text">{word}</u>
            </div>
          ))}
        </div>
        <div className="inputbox">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={isValid ? "invalid" : ""}
          />
        </div>
      </div>
    </div>
  );
}
