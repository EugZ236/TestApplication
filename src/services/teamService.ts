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
    const response = await api.get("/api/Teams");
    return response.data;
  },

  createTeam: async (name: string): Promise<Team> => {
    const response = await api.post("/api/Teams", { name });
    return response.data;
  },

  joinTeam: async (inviteCode: string) => {
    const response = await api.post("/api/Teams/join", { inviteCode });
    return response.data;
  },

  updateTeam: async (id: number, name: string): Promise<void> => {
    await api.put(`/api/Teams/${id}`, { name });
  },

  deleteTeam: async (id: number): Promise<void> => {
    await api.delete(`/Teams/${id}`);
  },
};

export default teamService;
