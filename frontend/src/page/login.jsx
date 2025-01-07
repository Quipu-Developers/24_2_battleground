import "../style/login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "../service/login_service";

export default function Login() {
  const { loginUser, register } = useAuthActions();
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  async function handleLogin() {
    try {
      const response = await loginUser(userName, phoneNumber);
      if (response.success) {
        navigate("/lobby", {
          state: { userName: userName, phoneNumber: phoneNumber },
        });
      } else alert(`로그인에 실패했습니다. ${response.errMsg}`);
    } catch (error) {
      alert("일시적인 오류가 발생했습니다. 나중에 다시 시도해주세요.");
    }
  }

  function RegisterModal() {
    const [userName, setUserName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const handleModalClose = async () => {
      setIsModalOpen(false);
      setUserName("");
      setPhoneNumber("");
    };

    const handleRegister = async () => {
      const response = await register(userName, phoneNumber);
      if (response.success) {
        alert(`회원가입에 성공했습니다!`);
      } else alert(`회원가입에 실패했습니다. ${response.errMsg}`);
    };

    return (
      isModalOpen && (
        <>
          <div className="lg-modal-overlay"></div>
          <div className="lg-modal">
            <div className="lg-modal-content">
              <h2>
                <span>배틀글라운드</span> 회원가입
              </h2>
              <input
                value={userName}
                placeholder="이름"
                required
                onChange={(e) => setUserName(e.target.value)}
              />
              <input
                value={phoneNumber}
                placeholder="전화번호"
                required
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <button onClick={handleRegister}>가입하기</button>
              <button onClick={handleModalClose}>x</button>
            </div>
          </div>
        </>
      )
    );
  }

  return (
    <div className="lg-container">
      <div className="lg-leftcontainer">
        <div className="lg-title">
          <h1>배틀글라운드</h1>
          <div>&nbsp;&nbsp;&nbsp;︻╦╤── -</div>
          <img
            className="img2"
            src={process.env.PUBLIC_URL + "/image/irumae_sad.png"}
            alt="Sad"
          />
        </div>
        <div className="lg-rule">
          <li>
            타자 고수들의 <span>눈치싸움!</span>
          </li>
          <li>
            세 명의 플레이어가 화면에 등장하는 단어들을 빠르게 타이핑하며
            경쟁합니다. 단어를 입력하면 <strong>10점</strong>을 획득하고, 그
            단어는 모든 플레이어의 화면에서 사라집니다.
          </li>
          <li>
            게임 시간은 <strong>60초</strong> 입니다. 남은 시간이{" "}
            <strong>10초</strong> 이하가 되면 경고가 표시됩니다.
          </li>
          <li>
            누가 먼저 입력하느냐에 따라 점수가 달라지므로 <span>스피드</span>와{" "}
            <span>타이밍</span>이 모두 중요합니다.
          </li>
          <li>
            1분 동안 가장 많은 단어를 입력해 <span>Top 10</span>에 도전해보세요!
          </li>
          <li>
            눈치와 타이핑 실력으로 승부를 가리는 긴장감 넘치는
            <br />
            <span>타자게임</span>, 지금 시작합니다!
          </li>
        </div>
      </div>
      <div className="lg-rightcontainer">
        <div className="lg-rightcontainer-back"></div>
        <div className="login-form">
          <input
            value={userName}
            placeholder="이름"
            required
            onChange={(e) => setUserName(e.target.value)}
          />
          <input
            value={phoneNumber}
            placeholder="전화번호"
            required
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button className="login-button" onClick={handleLogin}>
            로그인
          </button>
          <div className="lg-or"></div>
          <button className="signup-button" onClick={handleModalOpen}>
            회원가입
          </button>
        </div>
      </div>

      {RegisterModal(isModalOpen)}
    </div>
  );
}
