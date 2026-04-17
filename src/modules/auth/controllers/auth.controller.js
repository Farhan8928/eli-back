const { apiResponse } = require("../../../common/utils/apiResponse");
const { AuthService } = require("../services/auth.service");
const { toAuthRegisterDto } = require("../dto/register.dto");
const { toAuthLoginDto } = require("../dto/login.dto");

const authService = new AuthService();

const authController = {
  register: async (req, res) => {
    const result = await authService.register(req.validated.body);
    return res.status(201).json(
      apiResponse({
        message: "User registered successfully",
        data: toAuthRegisterDto(result),
      }),
    );
  },

  login: async (req, res) => {
    const result = await authService.login(req.validated.body);
    return res.status(200).json(
      apiResponse({
        message: "Login successful",
        data: toAuthLoginDto(result),
      }),
    );
  },
};

module.exports = { authController };
