import { apiResponse } from "../../../common/utils/apiResponse.js";
import { TransactionService } from "../services/transaction.service.js";
import {
  toTransactionDto,
  toTransactionListDto,
} from "../dto/transaction.dto.js";

const transactionService = new TransactionService();

const transactionController = {
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
};

export { transactionController };
