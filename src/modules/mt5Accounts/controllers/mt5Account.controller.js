const { apiResponse } = require("../../../common/utils/apiResponse");
const { Mt5AccountService } = require("../services/mt5Account.service");

class Mt5AccountController {
  constructor() {
    this.mt5AccountService = new Mt5AccountService();
  }

  createMine = async (req, res) => {
    const result = await this.mt5AccountService.createByClient(req.user, req.body);
    return res.status(201).json(
      apiResponse({
        message: "MT5 account created successfully",
        data: result
      })
    );
  };

  getMine = async (req, res) => {
    const result = await this.mt5AccountService.getMine(req.user);
    return res.status(200).json(
      apiResponse({
        message: "MT5 accounts fetched successfully",
        data: result
      })
    );
  };

  resetPasswordByAdmin = async (req, res) => {
    const result = await this.mt5AccountService.resetPasswordByAdmin(
      req.body.login,
      req.body.newPassword
    );
    return res.status(200).json(
      apiResponse({
        message: "MT5 password reset successful",
        data: result
      })
    );
  };
}

module.exports = { Mt5AccountController };