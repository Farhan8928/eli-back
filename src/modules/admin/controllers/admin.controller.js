import { apiResponse } from "../../../common/utils/apiResponse.js";
import { AdminService } from "../services/admin.service.js";
import {
  toClientDto,
  toClientsListDto,
  toDeleteUserDto,
  toAdminAnalyticsDto,
} from "../dto/manageUser.dto.js";

const adminService = new AdminService();

const adminController = {
  listClients: async (req, res) => {
    const result = await adminService.listClients(req.validated.query);
    return res.status(200).json(
      apiResponse({
        message: "Clients fetched successfully",
        data: toClientsListDto(result.items),
        meta: {
          total: result.total,
          page: Number(req.validated.query.page),
          limit: Number(req.validated.query.limit),
        },
      }),
    );
  },

  updateUser: async (req, res) => {
    const result = await adminService.updateUser(
      req.validated.params.userId,
      req.validated.body,
    );
    return res.status(200).json(
      apiResponse({
        message: "User updated successfully",
        data: toClientDto(result),
      }),
    );
  },

  deleteUser: async (req, res) => {
    const result = await adminService.deleteUser(req.validated.params.userId);
    return res.status(200).json(
      apiResponse({
        message: "User deleted successfully",
        data: toDeleteUserDto(result),
      }),
    );
  },

  analytics: async (req, res) => {
    const result = await adminService.getSystemAnalytics();
    return res.status(200).json(
      apiResponse({
        message: "System analytics fetched successfully",
        data: toAdminAnalyticsDto(result),
      }),
    );
  },
};

export { adminController };
