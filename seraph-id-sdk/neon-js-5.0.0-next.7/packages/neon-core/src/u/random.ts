const secureRandom = require('secure-random');

/**
 * Generates a arrayBuffer filled with random bits.
 * @param length - length of buffer.
 */
export const generateRandomArray = (length: number): number[] => {
  return secureRandom(length) as number[];
};
