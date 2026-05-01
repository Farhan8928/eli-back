import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../../../common/errors/AppError.js";
import { apiResponse } from "../../../common/utils/apiResponse.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";
import bcrypt from "bcryptjs";

const userRepository = new UserRepository();

const userController = {
  getMe: async (req, res) => {
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    
    // Convert to object and remove password if findById didn't already
    const userObj = user.toObject();
    delete userObj.password;
    
    return res.status(200).json(apiResponse({ data: userObj }));
  },

  updateProfile: async (req, res) => {
    const { name, phone, country, avatarUrl } = req.body;
    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (phone) updatePayload.phone = phone;
    if (country) updatePayload.country = country;
    if (avatarUrl) updatePayload.avatarUrl = avatarUrl;

    const updated = await userRepository.updateById(req.user.id, { $set: updatePayload });
    
    await AuditLog.create({
      userType: "client",
      log: `Client updated profile information`,
      metadata: { userId: req.user.id, updates: updatePayload }
    });

    return res.status(200).json(apiResponse({ 
      message: "Profile updated successfully", 
      data: updated 
    }));
  },

  updateBankDetails: async (req, res) => {
    const { bankDetails } = req.body;
    const updated = await userRepository.updateById(req.user.id, { $set: { bankDetails } });

    await AuditLog.create({
      userType: "client",
      log: `Client updated bank details`,
      metadata: { userId: req.user.id }
    });

    return res.status(200).json(apiResponse({ 
      message: "Bank details updated successfully", 
      data: updated 
    }));
  },

  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await userRepository.findById(req.user.id);
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError("Current password incorrect", 400, "INVALID_PASSWORD");

    const hash = await bcrypt.hash(newPassword, 12);
    await userRepository.updateById(req.user.id, { $set: { password: hash } });

    await AuditLog.create({
      userType: "client",
      log: `Client changed their password`,
      metadata: { userId: req.user.id }
    });

    return res.status(200).json(apiResponse({ message: "Password changed successfully" }));
  },

  uploadKyc: async (req, res) => {
    const { idProofUrl, addressProofUrl } = req.body;
    const kycPayload = { kycStatus: "pending" };
    if (idProofUrl) kycPayload.idProofUrl = idProofUrl;
    if (addressProofUrl) kycPayload.addressProofUrl = addressProofUrl;

    const updated = await userRepository.updateById(req.user.id, { $set: kycPayload });

    await AuditLog.create({
      userType: "client",
      log: `Client submitted KYC documents`,
      metadata: { userId: req.user.id }
    });

    return res.status(200).json(apiResponse({ 
      message: "KYC documents submitted for review",
      data: { kycStatus: "pending" }
    }));
  }
};

export { userController };
