import { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { apiManager } from './api/apiManager'
import Home from './pages/Home';
import FriendRoom from './pages/FriendRoom'

function App() {
  const [user, setUser] = useState("");

  useEffect(() => {
    // Fetch user ID
    (async () => {
      try {
        let data = await apiManager.getUserId();
        setUser(data);
        console.log("User ID:", data);
      } catch (error) {
        console.error("Failed to get user ID:", error);
      }
    })();


  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/friend-room" element={<FriendRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App