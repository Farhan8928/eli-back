import { apiResponse } from "../../../common/utils/apiResponse.js";
import { AppError } from "../../../common/errors/AppError.js";
import { TransactionService } from "../services/transaction.service.js";
import * as depositSettingsService from "../../admin/services/depositSettings.service.js";
import * as depositQrGridfs from "../../admin/services/depositQrGridfs.service.js";
import {
  toTransactionDto,
  toTransactionListDto,
} from "../dto/transaction.dto.js";

const transactionService = new TransactionService();

const transactionController = {
  getDepositInstructions: async (req, res) => {
    const data = await depositSettingsService.getDepositSettingsForApi();
    return res.status(200).json(
      apiResponse({
        message: "ok",
        data,
      }),
    );
  },

  streamDepositQrFile: async (req, res) => {
    const id = await depositSettingsService.getQrCodeFileId();
    if (!id) {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }
    const ok = await depositQrGridfs.pipeFileToResponse(id, res);
    if (!ok) {
      throw new AppError("File not found", 404, "FILE_NOT_FOUND");
    }
  },

  createManual: async (req, res) => {
    const result = await transactionService.createManual(
      req.user,
      req.validated.body,
    );
    return res.status(201).json(
      apiResponse({
        message: "Transaction recorded successfully",
        data: toTransactionDto(result),
      }),
    );
  },

  getMine: async (req, res) => {
    const result = await transactionService.getMine(req.user);
    return res.status(200).json(
      apiResponse({
        message: "Transactions fetched successfully",
        data: toTransactionListDto(result),
      }),
    );
  },

  requestDeposit: async (req, res) => {
    const result = await transactionService.requestDeposit(
      req.user,
      req.validated.body,
    );
    return res.status(201).json(
      apiResponse({
        message: "Deposit request submitted successfully",
        data: toTransactionDto(result),
      }),
    );
  },

  requestWithdrawal: async (req, res) => {
    const result = await transactionService.requestWithdrawal(
      req.user,
      req.validated.body,
    );
    return res.status(201).json(
      apiResponse({
        message: "Withdrawal request submitted successfully",
        data: toTransactionDto(result),
      }),
    );
  },
};

export { transactionController };
