import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../../../common/errors/AppError.js";
import { apiResponse } from "../../../common/utils/apiResponse.js";
import { AuditLog } from "../../admin/models/auditLog.model.js";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import * as kycGridfsService from "../services/kycGridfs.service.js";
import {
  resolveClientAddressProofPath,
  resolveClientIdProofPath,
} from "../utils/kycPublicPaths.js";

const userRepository = new UserRepository();

async function optimizeKycImage(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 1400,
      withoutEnlargement: true,
    })
    .webp({ quality: 70 })
    .toBuffer();
}

function sanitizeUserForClient(userDoc) {
  const userObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete userObj.password;
  const idProofUrl = resolveClientIdProofPath(userObj);
  const addressProofUrl = resolveClientAddressProofPath(userObj);
  delete userObj.idProofFileId;
  delete userObj.addressProofFileId;
  userObj.idProofUrl = idProofUrl;
  userObj.addressProofUrl = addressProofUrl;
  return userObj;
}

const userController = {
  getMe: async (req, res) => {
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const userObj = sanitizeUserForClient(user);

    return res.status(200).json(apiResponse({ data: userObj }));
  },

  updateProfile: async (req, res) => {
    const { name, phone, country, avatarUrl } = req.body;
    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (phone) updatePayload.phone = phone;
    if (country) updatePayload.country = country;
    if (avatarUrl) updatePayload.avatarUrl = avatarUrl;

    const updated = await userRepository.updateById(req.user.id, {
      $set: updatePayload,
    });

    await AuditLog.create({
      userType: "client",
      log: `Client updated profile information`,
      metadata: { userId: req.user.id, updates: updatePayload },
    });

    return res.status(200).json(
      apiResponse({
        message: "Profile updated successfully",
        data: sanitizeUserForClient(updated),
      }),
    );
  },

  updateBankDetails: async (req, res) => {
    const { bankDetails } = req.body;
    const updated = await userRepository.updateById(req.user.id, {
      $set: { bankDetails },
    });

    await AuditLog.create({
      userType: "client",
      log: `Client updated bank details`,
      metadata: { userId: req.user.id },
    });

    return res.status(200).json(
      apiResponse({
        message: "Bank details updated successfully",
        data: sanitizeUserForClient(updated),
      }),
    );
  },

  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await userRepository.findById(req.user.id);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid)
      throw new AppError("Current password incorrect", 400, "INVALID_PASSWORD");

    const hash = await bcrypt.hash(newPassword, 12);
    await userRepository.updateById(req.user.id, { $set: { password: hash } });

    await AuditLog.create({
      userType: "client",
      log: `Client changed their password`,
      metadata: { userId: req.user.id },
    });

    return res
      .status(200)
      .json(apiResponse({ message: "Password changed successfully" }));
  },

  uploadKyc: async (req, res) => {
    const { idProofUrl, addressProofUrl } = req.body;
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const kycPayload = { kycStatus: "pending" };
    const fileIdsToDelete = [];

    const nextIdProofUrl =
      typeof idProofUrl === "string" ? idProofUrl.trim() : "";
    if (nextIdProofUrl) {
      kycPayload.idProofUrl = nextIdProofUrl;
      kycPayload.idProofFileId = null;
      if (user.idProofFileId) fileIdsToDelete.push(user.idProofFileId);
    }

    const nextAddressProofUrl =
      typeof addressProofUrl === "string" ? addressProofUrl.trim() : "";
    if (nextAddressProofUrl) {
      kycPayload.addressProofUrl = nextAddressProofUrl;
      kycPayload.addressProofFileId = null;
      if (user.addressProofFileId) {
        fileIdsToDelete.push(user.addressProofFileId);
      }
    }

    await userRepository.updateById(req.user.id, { $set: kycPayload });

    if (fileIdsToDelete.length) {
      await kycGridfsService.deleteFileIds(fileIdsToDelete);
    }

    await AuditLog.create({
      userType: "client",
      log: `Client submitted KYC documents`,
      metadata: { userId: req.user.id },
    });

    return res.status(200).json(
      apiResponse({
        message: "KYC documents submitted for review",
        data: { kycStatus: "pending" },
      }),
    );
  },

  uploadKycIdProof: async (req, res) => {
    if (!req.file) throw new AppError("No file uploaded", 400, "NO_FILE");

    const user = await userRepository.findById(req.user.id);
    const previousFileId = user?.idProofFileId;
    const optimizedBuffer = await optimizeKycImage(req.file.buffer);
    const filename = `${req.user.id}-idProof-${Date.now()}.webp`;

    const fileId = await kycGridfsService.uploadFromBuffer(optimizedBuffer, {
      filename,
      contentType: "image/webp",
      userId: req.user.id,
      docKind: "idProof",
    });

    await userRepository.updateById(req.user.id, {
      $set: { idProofFileId: fileId, idProofUrl: null, kycStatus: "pending" },
    });

    if (previousFileId) {
      await kycGridfsService.deleteFile(previousFileId);
    }

    await AuditLog.create({
      userType: "client",
      log: `Client uploaded identity KYC document`,
      metadata: { userId: req.user.id },
    });

    const idProofUrl = resolveClientIdProofPath({
      idProofFileId: fileId,
      idProofUrl: null,
    });

    return res.status(200).json(
      apiResponse({
        message: "Identity document uploaded for review",
        data: { idProofUrl, kycStatus: "pending" },
      }),
    );
  },

  uploadKycAddressProof: async (req, res) => {
    if (!req.file) throw new AppError("No file uploaded", 400, "NO_FILE");

    const user = await userRepository.findById(req.user.id);
    const previousFileId = user?.addressProofFileId;
    const optimizedBuffer = await optimizeKycImage(req.file.buffer);
    const filename = `${req.user.id}-addressProof-${Date.now()}.webp`;

    const fileId = await kycGridfsService.uploadFromBuffer(optimizedBuffer, {
      filename,
      contentType: "image/webp",
      userId: req.user.id,
      docKind: "addressProof",
    });

    await userRepository.updateById(req.user.id, {
      $set: {
        addressProofFileId: fileId,
        addressProofUrl: null,
        kycStatus: "pending",
      },
    });

    if (previousFileId) {
      await kycGridfsService.deleteFile(previousFileId);
    }

    await AuditLog.create({
      userType: "client",
      log: `Client uploaded address KYC document`,
      metadata: { userId: req.user.id },
    });

    const addressProofUrl = resolveClientAddressProofPath({
      addressProofFileId: fileId,
      addressProofUrl: null,
    });

    return res.status(200).json(
      apiResponse({
        message: "Address proof uploaded for review",
        data: { addressProofUrl, kycStatus: "pending" },
      }),
    );
  },

  streamKycIdProofForMe: async (req, res) => {
    const user = await userRepository.findById(req.user.id);
    if (!user?.idProofFileId) {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }
    const ok = await kycGridfsService.pipeFileToResponse(
      user.idProofFileId,
      res,
    );
    if (!ok) {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }
  },

  streamKycAddressProofForMe: async (req, res) => {
    const user = await userRepository.findById(req.user.id);
    if (!user?.addressProofFileId) {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }
    const ok = await kycGridfsService.pipeFileToResponse(
      user.addressProofFileId,
      res,
    );
    if (!ok) {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }
  },
};

export { userController };
