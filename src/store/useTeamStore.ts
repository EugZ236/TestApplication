import { create } from "zustand";
import teamService from "../services/teamService";

interface TeamState {
  teams: any[];
  isLoading: boolean;
  fetchTeams: () => Promise<void>;
  deleteTeam: (id: number) => Promise<void>;
  updateTeamName: (id: number, name: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  isLoading: false,

  fetchTeams: async () => {
    set({ isLoading: true });
    try {
      const data = await teamService.getTeams();
      set({ teams: data });
    } catch (error) {
      console.error("Fetch teams error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTeam: async (id: number) => {
    await teamService.deleteTeam(id);
    set({ teams: get().teams.filter((t) => t.id !== id) });
  },

  updateTeamName: async (id: number, name: string) => {
    await teamService.updateTeam(id, name);
    set({
      teams: get().teams.map((t) => (t.id === id ? { ...t, name } : t)),
    });
  },
}));
