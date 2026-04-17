const { apiResponse } = require("../../../common/utils/apiResponse");
const { TransactionService } = require("../services/transaction.service");
const {
  toTransactionDto,
  toTransactionListDto,
} = require("../dto/transaction.dto");

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

module.exports = { transactionController };
