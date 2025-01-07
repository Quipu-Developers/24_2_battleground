import "./App.css";
import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./page/login";
import Lobby from "./page/lobby";
import WaitingRoom from "./page/waitingRoom";
import Game from "./page/game";
import End from "./page/end";
import { SocketProvider } from "./socket";

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/game" element={<Game />} />
          <Route path="/end" element={<End />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
