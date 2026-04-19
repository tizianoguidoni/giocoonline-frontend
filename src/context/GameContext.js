import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const GameProvider = ({ children }) => {
  const { character, refreshCharacter, isAuthenticated } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [quests, setQuests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [clans, setClans] = useState([]);
  const [currentClan, setCurrentClan] = useState(null);

  const fetchInventory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get(`${API}/inventory`);
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  }, [isAuthenticated]);

  const fetchQuests = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get(`${API}/quests`);
      setQuests(response.data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    }
  }, [isAuthenticated]);

  const fetchSkills = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get(`${API}/combat/skills`);
      setSkills(response.data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  }, [isAuthenticated]);

  const fetchLeaderboard = useCallback(async (sortBy = 'level') => {
    try {
      const response = await axios.get(`${API}/leaderboard?sort_by=${sortBy}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, []);

  const fetchChatHistory = useCallback(async (channel = 'global') => {
    try {
      const response = await axios.get(`${API}/chat/history?channel=${channel}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  }, []);

  const fetchClans = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/clans`);
      setClans(response.data);
    } catch (error) {
      console.error('Failed to fetch clans:', error);
    }
  }, []);

  const fetchCurrentClan = useCallback(async () => {
    if (!character?.clan_id) {
      setCurrentClan(null);
      return;
    }
    try {
      const response = await axios.get(`${API}/clans/${character.clan_id}`);
      setCurrentClan(response.data);
    } catch (error) {
      console.error('Failed to fetch current clan:', error);
    }
  }, [character?.clan_id]);

  useEffect(() => {
    if (isAuthenticated && character) {
      fetchInventory();
      fetchQuests();
      fetchSkills();
      fetchCurrentClan();
    }
  }, [isAuthenticated, character, fetchInventory, fetchQuests, fetchSkills, fetchCurrentClan]);

  // Game Actions
  const moveItem = async (itemId, newSlot) => {
    try {
      await axios.post(`${API}/inventory/move?item_id=${itemId}&new_slot=${newSlot}`);
      await fetchInventory();
    } catch (error) {
      console.error('Failed to move item:', error);
      throw error;
    }
  };

  const equipItem = async (itemId) => {
    try {
      await axios.post(`${API}/inventory/equip/${itemId}`);
      await fetchInventory();
    } catch (error) {
      console.error('Failed to equip item:', error);
      throw error;
    }
  };

  const useItem = async (itemId) => {
    try {
      const response = await axios.post(`${API}/inventory/use/${itemId}`);
      await fetchInventory();
      await refreshCharacter();
      return response.data;
    } catch (error) {
      console.error('Failed to use item:', error);
      throw error;
    }
  };

  const updateQuestProgress = async (questId, amount = 1) => {
    try {
      const response = await axios.post(`${API}/quests/${questId}/progress?amount=${amount}`);
      await fetchQuests();
      await refreshCharacter();
      return response.data;
    } catch (error) {
      console.error('Failed to update quest progress:', error);
      throw error;
    }
  };

  const sendChatMessage = async (content, channel = 'global', recipientId = null) => {
    try {
      const response = await axios.post(`${API}/chat/send`, {
        content,
        channel,
        recipient_id: recipientId
      });
      await fetchChatHistory(channel);
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const performCombat = async (enemyId) => {
    try {
      const response = await axios.post(`${API}/combat/attack/${enemyId}`);
      await refreshCharacter();
      await fetchQuests();
      return response.data;
    } catch (error) {
      console.error('Failed to perform combat:', error);
      throw error;
    }
  };

  const joinMatchmaking = async () => {
    try {
      const response = await axios.post(`${API}/matchmaking/join`);
      return response.data;
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
      throw error;
    }
  };

  const leaveMatchmaking = async () => {
    try {
      await axios.post(`${API}/matchmaking/leave`);
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
      throw error;
    }
  };

  const createClan = async (name, description, tag) => {
    try {
      const response = await axios.post(`${API}/clans`, { name, description, tag });
      await fetchClans();
      await fetchCurrentClan();
      await refreshCharacter();
      return response.data;
    } catch (error) {
      console.error('Failed to create clan:', error);
      throw error;
    }
  };

  const joinClan = async (clanId) => {
    try {
      await axios.post(`${API}/clans/${clanId}/join`);
      await fetchCurrentClan();
      await refreshCharacter();
    } catch (error) {
      console.error('Failed to join clan:', error);
      throw error;
    }
  };

  const leaveClan = async () => {
    try {
      await axios.post(`${API}/clans/leave`);
      setCurrentClan(null);
      await refreshCharacter();
    } catch (error) {
      console.error('Failed to leave clan:', error);
      throw error;
    }
  };

  return (
    <GameContext.Provider value={{
      inventory,
      quests,
      skills,
      leaderboard,
      chatMessages,
      clans,
      currentClan,
      fetchInventory,
      fetchQuests,
      fetchSkills,
      fetchLeaderboard,
      fetchChatHistory,
      fetchClans,
      moveItem,
      equipItem,
      useItem,
      updateQuestProgress,
      sendChatMessage,
      performCombat,
      joinMatchmaking,
      leaveMatchmaking,
      createClan,
      joinClan,
      leaveClan
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
