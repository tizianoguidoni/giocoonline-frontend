import "@/App.css";
import "@/i18n";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GameProvider } from "@/context/GameContext";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CharacterCreatePage from "@/pages/CharacterCreatePage";
import GamePage from "@/pages/GamePage";
import LeaderboardPage from "@/pages/LeaderboardPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0914] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const CharacterRoute = ({ children }) => {
  const { character, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0914] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }
  
  if (!character) {
    return <Navigate to="/create-character" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { isAuthenticated, character } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={character ? "/game" : "/create-character"} replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to={character ? "/game" : "/create-character"} replace /> : <RegisterPage />} 
      />
      <Route 
        path="/create-character" 
        element={
          <ProtectedRoute>
            {character ? <Navigate to="/game" replace /> : <CharacterCreatePage />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/game" 
        element={
          <ProtectedRoute>
            <CharacterRoute>
              <GamePage />
            </CharacterRoute>
          </ProtectedRoute>
        } 
      />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
