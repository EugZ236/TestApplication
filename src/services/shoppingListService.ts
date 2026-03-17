import api from "./api";

export interface CreateShoppingListItemRequest {
  teamId: number;
  productId?: number | null;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  note?: string | null;
}

export interface ShoppingListItemDto {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  note?: string;
  isBought?: boolean;
  assignedToUserId?: number | null;
  productId?: number | null;
}

const shoppingListService = {
  getByTeam: async (teamId: number): Promise<ShoppingListItemDto[]> => {
    const response = await api.get<ShoppingListItemDto[]>(
      `api/lists/items/team/${teamId}`,
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  createItem: async (
    payload: CreateShoppingListItemRequest,
  ): Promise<number> => {
    const response = await api.post<number>("api/lists/items", payload);
    return response.data;
  },

  updateItem: async (
    id: number,
    payload: Partial<CreateShoppingListItemRequest> & {
      isBought?: boolean;
      assignedToUserId?: number | null;
    },
  ): Promise<void> => {
    await api.put(`api/lists/items/${id}`, payload);
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`api/lists/items/${id}`);
  },
};

export default shoppingListService;
