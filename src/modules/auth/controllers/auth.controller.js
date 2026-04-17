const { apiResponse } = require("../../../common/utils/apiResponse");
const { AuthService } = require("../services/auth.service");

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req, res) => {
    const result = await this.authService.register(req.body);
    return res.status(201).json(
      apiResponse({
        message: "User registered successfully",
        data: result
      })
    );
  };

  login = async (req, res) => {
    const result = await this.authService.login(req.body);
    return res.status(200).json(
      apiResponse({
        message: "Login successful",
        data: result
      })
    );
  };
}

module.exports = { AuthController };