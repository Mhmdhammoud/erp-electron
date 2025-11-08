import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format currency in USD
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format currency in LBP
 */
export const formatLBP = (amount: number): string => {
  return new Intl.NumberFormat('en-LB', {
    style: 'currency',
    currency: 'LBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Convert USD to LBP
 */
export const convertToLBP = (usd: number, exchangeRate: number): number => {
  return usd * exchangeRate;
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, formatStr = 'PPP'): string => {
  if (!date) return '-';
  return format(new Date(date), formatStr);
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';
  return format(new Date(date), 'PPP p');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '-';
  // Simple formatting - can be enhanced based on region
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};
