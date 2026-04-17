const { apiResponse } = require("../../../common/utils/apiResponse");
const { AdminService } = require("../services/admin.service");

class AdminController {
  constructor() {
    this.adminService = new AdminService();
  }

  listClients = async (req, res) => {
    const result = await this.adminService.listClients(req.query);
    return res.status(200).json(
      apiResponse({
        message: "Clients fetched successfully",
        data: result.items,
        meta: {
          total: result.total,
          page: Number(req.query.page),
          limit: Number(req.query.limit)
        }
      })
    );
  };

  updateUser = async (req, res) => {
    const result = await this.adminService.updateUser(req.params.userId, req.body);
    return res.status(200).json(
      apiResponse({
        message: "User updated successfully",
        data: result
      })
    );
  };

  deleteUser = async (req, res) => {
    const result = await this.adminService.deleteUser(req.params.userId);
    return res.status(200).json(
      apiResponse({
        message: "User deleted successfully",
        data: result
      })
    );
  };

  analytics = async (req, res) => {
    const result = await this.adminService.getSystemAnalytics();
    return res.status(200).json(
      apiResponse({
        message: "System analytics fetched successfully",
        data: result
      })
    );
  };
}

module.exports = { AdminController };