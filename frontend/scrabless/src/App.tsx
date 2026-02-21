import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FriendRoom from './pages/FriendRoom'
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/authContext';
import { useEffect, useRef, useState } from 'react';
import { apiManager } from './api/apiManager';
import { TestGame } from './components/TestGame';
import { GameProvider } from './context/GameContext';
async function authenticate() {
  const user = await apiManager.getUser();
  console.log(user);
  return user;
}

function App() {
  const [authDone, setAuthDone] = useState(false);
  const auth = useAuth();
  const hasAuthenticated = useRef(false);

  useEffect(() => {
    (async () => {
      if (hasAuthenticated.current) return;
      hasAuthenticated.current = true;

      try {
        const user = await authenticate();
        auth.login(user);
      } catch (err) {
        console.error("Authentication failed", err);
      } finally {
        setAuthDone(true); // mark authentication as complete
      }
    })();
  }, []);

  // Show a loading screen until authentication is done
  if (!authDone) {
    return <div className="h-full w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/friend-room" element={<FriendRoom />} />
          <Route path="/test" element={<TestGame />} />

        </Routes>
      </BrowserRouter>
    </GameProvider >
  )
}

export default App;