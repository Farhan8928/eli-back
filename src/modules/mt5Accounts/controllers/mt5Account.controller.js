const { apiResponse } = require("../../../common/utils/apiResponse");
const { Mt5AccountService } = require("../services/mt5Account.service");
const {
  toMt5AccountListDto,
  toCreateMt5AccountDto,
  toResetMt5PasswordDto
} = require("../dto/createMt5Account.dto");

const mt5AccountService = new Mt5AccountService();

const mt5AccountController = {
  createMine: async (req, res) => {
    const result = await mt5AccountService.createByClient(req.user, req.validated.body);
    return res.status(201).json(
      apiResponse({
        message: "MT5 account created successfully",
        data: toCreateMt5AccountDto(result)
      })
    );
  },

  getMine: async (req, res) => {
    const result = await mt5AccountService.getMine(req.user);
    return res.status(200).json(
      apiResponse({
        message: "MT5 accounts fetched successfully",
        data: toMt5AccountListDto(result)
      })
    );
  },

  resetPasswordByAdmin: async (req, res) => {
    const result = await mt5AccountService.resetPasswordByAdmin(
      req.validated.body.login,
      req.validated.body.newPassword
    );
    return res.status(200).json(
      apiResponse({
        message: "MT5 password reset successful",
        data: toResetMt5PasswordDto(result)
      })
    );
  }
};

module.exports = { mt5AccountController };