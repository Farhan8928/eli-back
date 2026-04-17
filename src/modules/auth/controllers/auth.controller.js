import { apiResponse } from "../../../common/utils/apiResponse.js";
import { AuthService } from "../services/auth.service.js";
import { toAuthRegisterDto } from "../dto/register.dto.js";
import { toAuthLoginDto } from "../dto/login.dto.js";

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

export { authController };
