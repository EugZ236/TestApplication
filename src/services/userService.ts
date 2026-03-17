import { DietaryPreferenceId } from "@/src/constants/dietaryPreferences";
import api from "./api";

export interface UserNameResponse {
  firstName: string;
  lastName: string;
}

const userService = {
  getName: async (): Promise<UserNameResponse> => {
    const response = await api.get("/api/Users/name");
    return response.data;
  },

  getPhoto: async (): Promise<string | null> => {
    const response = await api.get("/api/Users/photo");
    return response.data ?? null;
  },

  savePhoto: async (photoBase64: string): Promise<void> => {
    await api.put("/api/Users/photo", { photoBase64 });
  },

  deletePhoto: async (): Promise<void> => {
    await api.delete("/api/Users/photo");
  },

  getPreferences: async (): Promise<DietaryPreferenceId[]> => {
    const response = await api.get("/api/Users/preferences");
    return response.data;
  },

  replacePreferences: async (
    preferences: DietaryPreferenceId[],
  ): Promise<void> => {
    await api.put("/api/Users/preferences", { preferences });
  },
};

export default userService;
