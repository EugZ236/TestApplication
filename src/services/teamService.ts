import api from "./api";

export interface Team {
  id: number;
  name: string;
  inviteCode: string;
  role: string;
  joinedAt: string;
  memberCount: number;
}

const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const response = await api.get("/Teams");
    return response.data;
  },

  createTeam: async (name: string): Promise<Team> => {
    const response = await api.post("/Teams", { name });
    return response.data;
  },
};

export default teamService;
