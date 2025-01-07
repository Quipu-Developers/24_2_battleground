import "../style/end.css";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { getGameEndInfo } from "../service/http_service";
import { useAuthActions } from "../service/login_service";
import { useSocket } from "../socket";

const End = () => {
  const location = useLocation();
  const { storage } = useSocket();
  const { logoutUser } = useAuthActions();
  const [gameEndInfo, setGameEndInfo] = useState(null);
  const userId = storage.getItem("userId");
  const navigate = useNavigate();
  const { users } = location.state || {};
  console.log(users);

  const handleStartClick = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("로그아웃 실패:", error.message);
    }
  };

  useEffect(() => {
    const fetchGameEndInfo = async () => {
      try {
        const fetchedGameEndInfo = await getGameEndInfo(userId);
        setGameEndInfo(fetchedGameEndInfo);
      } catch (error) {
        console.error("Error fetching game end info:", error);
      }
    };

    fetchGameEndInfo();
  }, [userId]);

  if (!gameEndInfo) {
    return (
      <div className="game-result-screen">
        <div className="header">
          <h1>배틀글라운드 게임 결과</h1>
        </div>
        <div className="content">
          <div className="wrap">
            <div className="overall-ranking">
              <div className="ranking-item1">
                <div className="ranking-loading">등수 계산 중...😵‍💫😵‍💫</div>
              </div>
            </div>
          </div>
        </div>
        <div className="home-button" onClick={handleStartClick}>
          <img
            className="back"
            alt="버튼"
            src={process.env.PUBLIC_URL + "/image/home.png"}
          />
        </div>
      </div>
    );
  }

  const { personalRank, top10 } = gameEndInfo;

  return (
    <div className="game-result-screen">
      <div className="header">
        <h1>GAME RESULT</h1>
      </div>

      {users && (
        <div className="current-score">
          <h1>SCORE</h1>
          <div className="ranking-num" style={{ border: "2px solid #000" }}>
            <span style={{ color: "#3b4755" }}>{users[0]?.userName}</span>{" "}
            <span
              style={{
                color: "white",
                WebkitTextStroke: "1.5px #11324d",
              }}
            >
              {users[0]?.score}
            </span>
          </div>
          <div className="ranking-num" style={{ border: "2px solid #000" }}>
            <span style={{ color: "#3b4755" }}>{users[1]?.userName}</span>{" "}
            <span
              style={{
                color: "white",
                WebkitTextStroke: "1.5px #11324d",
              }}
            >
              {users[1]?.score}
            </span>
          </div>
          <div className="ranking-num" style={{ border: "2px solid #000" }}>
            <span style={{ color: "#3b4755" }}>{users[2]?.userName}</span>{" "}
            <span
              style={{
                color: "white",
                WebkitTextStroke: "1.5px #11324d",
              }}
            >
              {users[2]?.score}
            </span>
          </div>
        </div>
      )}

<div className="content">
        <div className="wrap">
          <div className="overall-ranking">
            <h1>Top 10</h1>
            <div className="ranking-item1">
              {top10.map((player, index) => (
                <div
                  key={player.userId}
                  className="ranking-number"
                  style={{
                    border:
                      player.userId === Number(userId)
                        ? "2px solid #000"
                        : "none",
                    backgroundColor:
                      player.userId === Number(userId)
                        ? "#f0f0f0"
                        : "transparent",
                  }}
                >
                  <div className="rank-info">
                    {index < 3 && (
                      <img
                        className="teamicon"
                        alt={`${index + 1}등`}
                        src={process.env.PUBLIC_URL + `/image/${['first', 'second', 'third'][index]}.png`}
                      />
                    )}
                    <span className="rank-text">{player.rank}위</span>
                  </div>
                  <span className="player-name">{player.userName}</span>{" "}
                  <span className="player-score">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
            <div className="ranking-item2">
              {/* top10에 자신이 포함되지 않은 경우에만 자신의 순위를 추가로 렌더링 */}
              <div></div>
              {!top10.some((player) => player.userId === Number(userId)) && (
                <div
                  className="ranking-number"
                  style={{ border: "2px solid #000" }}
                >
                  <span style={{ color: "#3b4755" }}>
                    &nbsp;{personalRank.rank}위
                  </span>{" "}
                  <span style={{ color: "#3b4755" }}>
                    {personalRank.userName}
                  </span>{" "}
                  <span
                    style={{
                      color: "white",
                      WebkitTextStroke: "1.5px #11324d",
                    }}
                  >
                    {personalRank.score}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="home-button" onClick={handleStartClick}>
        <img
          className="back"
          alt="버튼"
          src={process.env.PUBLIC_URL + "/image/home.png"}
        />
      </div>
    </div>
  );
};

export default End;
