import api from "./api";

export interface CreateBudgetRequest {
  teamId: number;
  month: number;
  year: number;
  limitAmount: number;
  currentSpent?: number;
}

const budgetService = {
  createBudget: async (payload: CreateBudgetRequest): Promise<number> => {
    const response = await api.post<number>("/api/Budgets", payload);
    return response.data;
  },
  getBudgetsByTeam: async (teamId: number) => {
    const response = await api.get<any[]>(`/api/Budgets/team/${teamId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default budgetService;
