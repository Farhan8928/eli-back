const toClientDto = (user) => ({
  id: String(user?._id || user?.id || ""),
  name: String(user?.name || ""),
  email: String(user?.email || ""),
  role: String(user?.role || ""),
  kycStatus: String(user?.kycStatus || ""),
  createdAt: user?.createdAt || null,
  updatedAt: user?.updatedAt || null,
});

const toClientsListDto = (items) =>
  Array.isArray(items) ? items.map(toClientDto) : [];

const toDeleteUserDto = (payload) => ({
  id: String(payload?.id || ""),
  deleted: Boolean(payload?.deleted),
});

const toAdminAnalyticsDto = (payload) => ({
  totalClients: Number(payload?.totalClients || 0),
  approvedKyc: Number(payload?.approvedKyc || 0),
  totalMt5Accounts: Number(payload?.totalMt5Accounts || 0),
  totalDeposits: Number(payload?.totalDeposits || 0),
  totalWithdrawals: Number(payload?.totalWithdrawals || 0),
});

export { toClientDto,
  toClientsListDto,
  toDeleteUserDto,
  toAdminAnalyticsDto, };
