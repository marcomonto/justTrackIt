/**
 * Utility function to parse prices with various formats
 * Handles different decimal and thousand separators
 *
 * Examples:
 * - "1.234,56" (EU format) → 1234.56
 * - "1,234.56" (US format) → 1234.56
 * - "1234.56" → 1234.56
 * - "1234,56" → 1234.56
 */
export function parsePrice(priceString: string): number {
  if (!priceString) {
    throw new Error('Price string is empty');
  }

  // Remove all whitespace
  const cleaned = priceString.trim();

  // Check if there are both dots and commas
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  let normalizedPrice: string;

  if (hasDot && hasComma) {
    // Both separators present - determine which is decimal
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');

    if (lastComma > lastDot) {
      // Comma is decimal separator (EU format: 1.234,56)
      normalizedPrice = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator (US format: 1,234.56)
      normalizedPrice = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma - check if it's thousands or decimal separator
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator (e.g., "1234,56")
      normalizedPrice = cleaned.replace(',', '.');
    } else {
      // Likely thousands separator (e.g., "1,234" or "12,345,678")
      normalizedPrice = cleaned.replace(/,/g, '');
    }
  } else if (hasDot) {
    // Only dot - check if it's thousands or decimal separator
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator (e.g., "1234.56")
      normalizedPrice = cleaned;
    } else {
      // Likely thousands separator (e.g., "1.234" or "12.345.678")
      normalizedPrice = cleaned.replace(/\./g, '');
    }
  } else {
    // No separators
    normalizedPrice = cleaned;
  }

  const price = parseFloat(normalizedPrice);

  if (isNaN(price)) {
    throw new Error(`Invalid price format: ${priceString}`);
  }

  return price;
}
