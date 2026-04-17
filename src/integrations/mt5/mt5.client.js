const axios = require("axios");
const {
  mt5ServiceBaseUrl,
  mt5ServiceApiKey,
  mt5Login,
  mt5Password,
  mt5Server
} = require("../../config/env");
const { AppError } = require("../../common/errors/AppError");

class Mt5Client {
  constructor() {
    this.http = axios.create({
      baseURL: mt5ServiceBaseUrl,
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        ...(mt5ServiceApiKey ? { "x-api-key": mt5ServiceApiKey } : {})
      }
    });
  }

  normalizeError(error) {
    const statusCode = error.response?.status || 502;
    const message = error.response?.data?.error?.message || error.message || "MT5 service failed";
    return new AppError(message, statusCode, "MT5_SERVICE_ERROR", error.response?.data || null);
  }

  async createAccount(payload) {
    try {
      const { data } = await this.http.post("/mt5/create-account", {
        managerLogin: mt5Login,
        managerPassword: mt5Password,
        managerServer: mt5Server,
        ...payload
      });
      return data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async resetPassword(payload) {
    try {
      const { data } = await this.http.post("/mt5/reset-password", {
        managerLogin: mt5Login,
        managerPassword: mt5Password,
        managerServer: mt5Server,
        ...payload
      });
      return data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async getAccount(login) {
    try {
      const { data } = await this.http.get(`/mt5/account/${login}`, {
        params: {
          managerLogin: mt5Login,
          managerPassword: mt5Password,
          managerServer: mt5Server
        }
      });
      return data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }
}

module.exports = { Mt5Client };