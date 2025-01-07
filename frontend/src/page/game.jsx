import "../style/game.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameActions } from "../service/game_service";
import { useSocket } from "../socket";
import { debounce } from "lodash";

export default function Game() {
  const { socket, user } = useSocket();
  const location = useLocation();
  const { words: initialWords, users } = location.state || {};
  const { wordInput } = useGameActions();
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState(
    <img
      src={process.env.PUBLIC_URL + "/image/irumae_happy.png"}
      alt="profile"
    />
  );
  const [isTimeout, setIsTimeout] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();
  const [hiddenWords, setHiddenWords] = useState([]);
  const [userScore, setUserScore] = useState([0, 0, 0]);
  const [myRank, setMyRank] = useState(0);
  const [words, setWords] = useState(initialWords);
  const showTimeLeftMessage = false;
  const inputRef = useRef(null);
  const [count, setCount] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  const calculateMyRank = useCallback(
    (users) => {
      const sortedUsers = [...users].sort((a, b) => b.score - a.score);
      const myUser = sortedUsers.findIndex(
        (userObj) => String(userObj.userId) === String(user?.userId)
      );

      setMyRank(myUser + 1);
    },
    [user]
  );

  useEffect(() => {
    if (!socket) return;

    // 기존 리스너 제거 후 새로 등록
    const removeAllListeners = () => {
      socket.off("WORD");
      socket.off("ENDGAME");
      socket.off("NEWWORDS");
    };

    const getWord = ({ word, gameInfo }) => {
      setHiddenWords((prev) => [...prev, word]);
      setUserScore([
        gameInfo.users[0].score,
        gameInfo.users[1].score,
        gameInfo.users[2].score,
      ]);
      calculateMyRank(gameInfo.users);
    };

    const handleNewWords = ({ words: newWords }) => {
      setIsLoading(true);
      setTimeout(() => {
        setWords(newWords);
        setHiddenWords([]);
        setIsLoading(false);
      }, 500);
    };

    const setupSocketListeners = () => {
      removeAllListeners(); // 기존 리스너 제거
      socket.on("WORD", getWord);
      socket.on("ENDGAME", ({ users }) => {
        navigate("/end", {
          state: {
            users: users,
          },
        });
      });
      socket.on("NEWWORDS", handleNewWords);
    };

    if (socket.connected) {
      setupSocketListeners();
    } else {
      socket.connect();
      socket.once("connect", setupSocketListeners);
    }

    return () => {
      removeAllListeners();
    };
  }, [socket, navigate, calculateMyRank]);

  const handleSubmitWord = async (inputWord) => {
    const word = inputWord.trim();

    try {
      const response = await wordInput(word);
      if (response.success) {
        setUserScore([
          response.gameInfo.users[0].score,
          response.gameInfo.users[1].score,
          response.gameInfo.users[2].score,
        ]);

        calculateMyRank(response.gameInfo.users);
      }
    } catch (error) {
      console.error("Error submitting word:", error.message);
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = debounce(async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const trimmedInput = inputValue.trim();
      if (words.includes(trimmedInput)) {
        setSelectedImage(
          <img
            src={process.env.PUBLIC_URL + "/image/irumae_happy.png"}
            alt="profile"
          />
        );
        setHiddenWords((prev) => [...prev, trimmedInput]);
        setIsValid(false);

        // 서버로 단어 제출
        await handleSubmitWord(trimmedInput);
      } else {
        setSelectedImage(
          <img
            src={process.env.PUBLIC_URL + "/image/irumae_sad.png"}
            alt="profile"
          />
        );
        setIsValid(true);
      }

      setTimeout(() => {
        setIsValid(false);
      }, 300);

      setInputValue("");
    }
  }, 50);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  useEffect(() => {
    if (words.length > 0 && words.every((word) => hiddenWords.includes(word))) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [words, hiddenWords]);

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
        <div className="profile_name">{user?.userName}</div>
        <div className="profile_timer">
          <img
            className="timer"
            src={process.env.PUBLIC_URL + "/image/timer.png"}
            alt="timer"
          />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{count}
        </div>
        <div className="ranking">
          <div className="ranking_number">{myRank}</div>
        </div>
        <div className="rankbox">
          <div className="rankbox_title">실시간 점수</div>

          <div className="rankbox_first">
            <div>
              <p
                style={{
                  border:
                    users[0]?.userId === user?.userId ? "2px solid #000" : "",
                }}
              >
                {users[0]?.userName} {userScore[0]}점
              </p>
            </div>
          </div>

          <div className="rankbox_second">
            <div>
              <p
                style={{
                  border:
                    users[1]?.userId === user?.userId ? "2px solid #000" : "",
                }}
              >
                {users[1]?.userName} {userScore[1]}점
              </p>
            </div>
          </div>

          <div className="rankbox_third">
            <div>
              <p
                style={{
                  border:
                    users[2]?.userId === user?.userId ? "2px solid #000" : "",
                }}
              >
                {users[2]?.userName} {userScore[2]}점
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rightcontainer">
        <div className="wordbox">
          {showTimeLeftMessage && (
            <div className="time-left-message">
              <img
                src={process.env.PUBLIC_URL + "/image/alert.png"}
                alt="alert"
              />
            </div>
          )}
          {words?.map((word, index) => (
            <div
              key={index}
              className={hiddenWords.includes(word) ? "hidden-word" : ""}
            >
              <u className="text">{word}</u>
            </div>
          ))}
          {isLoading && (
            <div className="wordbox-loading">
              새 단어장으로 업데이트 중...🫨🫨
            </div>
          )}
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
