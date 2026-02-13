import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FriendRoom from './pages/FriendRoom'
import { Sidebar } from './components/Sidebar';

function App() {
  // const [user, setUser] = useState("");

  // useEffect(() => {
  //   // Fetch user ID
  //   (async () => {
  //     try {
  //       let data = await apiManager.getUserId();
  //       setUser(data);
  //       console.log("User ID:", data);
  //     } catch (error) {
  //       console.error("Failed to get user ID:", error);
  //     }
  //   })();


  // }, []);

  return (
    <BrowserRouter>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/friend-room" element={<FriendRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App