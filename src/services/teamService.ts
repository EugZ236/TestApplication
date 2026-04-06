import api from "./api";

export interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  userName?: string;
  normalizedUserName?: string;
  email?: string;
  avatar?: string;
  role?: string;
  lastSeen?: string;
}

export interface Team {
  id: number;
  name: string;
  inviteCode: string;
  role: string;
  joinedAt: string;
  memberCount: number;
  members?: TeamMember[];
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
    await api.delete(`/api/Teams/${id}`);
  },

  getTeamById: async (id: number): Promise<Team> => {
    const response = await api.get(`/api/Teams/${id}`);
    return response.data;
  },

  getParticipants: async (teamId: number): Promise<TeamMember[]> => {
    const response = await api.get(`/api/Teams/${teamId}/participants`);
    return response.data;
  },
};

export default teamService;
