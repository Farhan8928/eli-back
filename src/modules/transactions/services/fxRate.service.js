import axios from "axios";

const FRANKFURTER_USD_INR =
  "https://api.frankfurter.app/latest?from=USD&to=INR";

/** In-memory cache so we do not hit the public API on every page load. */
let cache = { rate: null, asOfDate: null, fetchedAt: 0 };
const TTL_MS = 60 * 60 * 1000;

/**
 * Latest USD→INR from Frankfurter (ECB reference). Not identical to bank/UPI,
 * but updates on business days and needs no API key.
 */
export async function fetchUsdInrRate() {
  const now = Date.now();
  if (
    cache.rate != null &&
    cache.asOfDate != null &&
    now - cache.fetchedAt < TTL_MS
  ) {
    return {
      rate: cache.rate,
      asOfDate: cache.asOfDate,
    };
  }

  const { data } = await axios.get(FRANKFURTER_USD_INR, {
    timeout: 12000,
    validateStatus: (s) => s === 200,
  });

  const rate = data?.rates?.INR;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid USD/INR in FX response");
  }

  const asOfDate =
    typeof data?.date === "string" && data.date ? data.date : null;

  cache = { rate, asOfDate, fetchedAt: now };
  return { rate, asOfDate };
}
