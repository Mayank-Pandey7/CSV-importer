/**
 * Splits an array into chunks of a given size.
 * Used to batch CSV rows before sending to the AI model,
 * keeping each request within a safe token budget.
 */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = { chunkArray };
