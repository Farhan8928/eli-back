const { apiResponse } = require("../../../common/utils/apiResponse");
const { TransactionService } = require("../services/transaction.service");

class TransactionController {
  constructor() {
    this.transactionService = new TransactionService();
  }

  createManual = async (req, res) => {
    const result = await this.transactionService.createManual(req.user, req.body);
    return res.status(201).json(
      apiResponse({
        message: "Transaction recorded successfully",
        data: result
      })
    );
  };

  getMine = async (req, res) => {
    const result = await this.transactionService.getMine(req.user);
    return res.status(200).json(
      apiResponse({
        message: "Transactions fetched successfully",
        data: result
      })
    );
  };
}

module.exports = { TransactionController };