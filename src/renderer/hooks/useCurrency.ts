import { useTenant } from './useTenant';
import { formatUSD, formatLBP, convertToLBP } from '../utils/formatters';

export function useCurrency() {
  const { exchangeRate } = useTenant();

  return {
    exchangeRate,
    convertToLBP: (usd: number) => convertToLBP(usd, exchangeRate),
    formatUSD,
    formatLBP,
    formatDual: (usd: number) => {
      const lbp = convertToLBP(usd, exchangeRate);
      return {
        usd: formatUSD(usd),
        lbp: formatLBP(lbp),
      };
    },
  };
}
