import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Market from "./pages/Market";
import Portfolio from "./pages/Portfolio";
import Tendency from "./pages/Tendency.jsx";
import Navbar from "./components/Navbar";
import Ranking from "./pages/Ranking";
import News from "./pages/News";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <PrivateRoute><Navbar /><Market /></PrivateRoute>
        } />
        <Route path="/portfolio" element={
          <PrivateRoute><Navbar /><Portfolio /></PrivateRoute>
        } />
        <Route path="/news" element={
          <PrivateRoute><Navbar /><News /></PrivateRoute>
        } />
        <Route path="/tendency" element={
          <PrivateRoute><Navbar /><Tendency /></PrivateRoute>
        } />
        <Route path="/ranking" element={
          <PrivateRoute><Navbar /><Ranking /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
