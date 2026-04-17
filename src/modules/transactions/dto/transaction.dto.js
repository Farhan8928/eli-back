const toTransactionDto = (tx) => ({
  id: String(tx?._id || tx?.id || ""),
  userId: String(tx?.userId || ""),
  type: String(tx?.type || ""),
  amount: Number(tx?.amount || 0),
  status: String(tx?.status || ""),
  note: String(tx?.note || ""),
  performedBy: String(tx?.performedBy || ""),
  createdAt: tx?.createdAt || null,
  updatedAt: tx?.updatedAt || null,
});

const toTransactionListDto = (items) =>
  Array.isArray(items) ? items.map(toTransactionDto) : [];

export { toTransactionDto, toTransactionListDto };
