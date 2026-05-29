import Config from "react-native-config";

import { API_ENDPOINTS } from "../../connection/snippet/apiEndpoints";

import {
  getToken,
} from "../../connection/token/tokenSlice";

import { fetchHandler } from "../../../core/utils/handler/fetchHandler";

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

export const profileApi = {
  // ================================
  // GET PROFILE
  // ================================

  async getProfile() {
    const token = await getToken();

    return await fetchHandler(
      `${API_BASE_URL}${API_ENDPOINTS.GET_PROFILE}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // ================================
  // UPDATE PROFILE
  // ================================

  async updateProfile(formData: any) {
    const token = await getToken();

    return await fetchHandler(
      `${API_BASE_URL}${API_ENDPOINTS.UPDATE_PROFILE}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );
  },
};