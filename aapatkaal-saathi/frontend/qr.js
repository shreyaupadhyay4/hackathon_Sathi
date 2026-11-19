/* Small offline QR encoder: version 10-L, UTF-8 byte mode. */
'use strict';
((root) => {
  const VERSION = 10;
  const SIZE = VERSION * 4 + 17;
  const DATA_LENGTHS = [68, 68, 69, 69];
  const ECC_LENGTH = 18;
  const MAX_BYTES = 270;

  function multiply(a, b) {
    let result = 0;
    for (let i = 7; i >= 0; i--) {
      result = (result << 1) ^ ((result >>> 7) * 0x11d);
      result ^= ((b >>> i) & 1) * a;
    }
    return result;
  }

  function bch(value, polynomial) {
    let shifted = value;
    const degree = polynomial.toString(2).length - 1;
    while (shifted.toString(2).length - 1 >= degree) {
      shifted ^= polynomial << (shifted.toString(2).length - 1 - degree);
    }
    return shifted;
  }

  function generator(degree) {
    let coefficients = [1];
    let root = 1;
    for (let i = 0; i < degree; i++) {
      const next = new Array(coefficients.length + 1).fill(0);
      coefficients.forEach((value, index) => {
        next[index] ^= value;
        next[index + 1] ^= multiply(value, root);
      });
      coefficients = next;
      root = multiply(root, 2);
    }
    return coefficients;
  }

  function remainder(data, divisor) {
    const result = data.concat(new Array(divisor.length - 1).fill(0));
    for (let i = 0; i < data.length; i++) {
      const factor = result[i];
      if (factor) divisor.forEach((coefficient, j) => { result[i + j] ^= multiply(coefficient, factor); });
    }
    return result.slice(data.length);
  }

  function codewords(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > MAX_BYTES) throw new RangeError(`QR text exceeds ${MAX_BYTES} UTF-8 bytes.`);
    const bits = [];
    const append = (value, length) => {
      for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    };
    append(0x7, 4);
    append(26, 8);
    append(0x4, 4);
    append(bytes.length, 16);
    bytes.forEach(byte => append(byte, 8));
    const totalBits = DATA_LENGTHS.reduce((sum, length) => sum + length, 0) * 8;
    for (let i = 0; i < Math.min(4, totalBits - bits.length); i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
    }
    for (let pad = 0; data.length < totalBits / 8; pad++) data.push(pad % 2 ? 0x11 : 0xec);

    const blocks = [];
    let offset = 0;
    for (const length of DATA_LENGTHS) {
      const block = data.slice(offset, offset + length);
      blocks.push({data: block, ecc: remainder(block, generator(ECC_LENGTH))});
      offset += length;
    }
    const output = [];
    for (let i = 0; i < Math.max(...DATA_LENGTHS); i++) {
      for (const block of blocks) if (i < block.data.length) output.push(block.data[i]);
    }
    for (let i = 0; i < ECC_LENGTH; i++) {
      for (const block of blocks) output.push(block.ecc[i]);
    }
    return output;
  }

  function makeMatrix(text) {
    const modules = Array.from({length: SIZE}, () => new Array(SIZE).fill(false));
    const reserved = Array.from({length: SIZE}, () => new Array(SIZE).fill(false));
    const setFunction = (row, column, dark) => {
      modules[row][column] = !!dark;
      reserved[row][column] = true;
    };
    const finder = (centerRow, centerColumn) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const row = centerRow + dy, column = centerColumn + dx;
          if (row < 0 || row >= SIZE || column < 0 || column >= SIZE) continue;
          const distance = Math.max(Math.abs(dy), Math.abs(dx));
          setFunction(row, column, distance !== 2 && distance !== 4);
        }
      }
    };
    const alignment = (centerRow, centerColumn) => {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunction(centerRow + dy, centerColumn + dx, Math.max(Math.abs(dy), Math.abs(dx)) !== 1);
        }
      }
    };

    finder(3, 3);
    finder(3, SIZE - 4);
    finder(SIZE - 4, 3);
    for (const row of [6, 28, 50]) {
      for (const column of [6, 28, 50]) {
        if (!reserved[row][column]) alignment(row, column);
      }
    }
    for (let i = 8; i < SIZE - 8; i++) {
      if (!reserved[6][i]) setFunction(6, i, i % 2 === 0);
      if (!reserved[i][6]) setFunction(i, 6, i % 2 === 0);
    }

    const format = (mask) => {
      const data = (1 << 3) | mask;
      const bits = ((data << 10) | bch(data << 10, 0x537)) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setFunction(i, 8, ((bits >>> i) & 1) !== 0);
      setFunction(7, 8, ((bits >>> 6) & 1) !== 0);
      setFunction(8, 8, ((bits >>> 7) & 1) !== 0);
      setFunction(8, 7, ((bits >>> 8) & 1) !== 0);
      for (let i = 9; i < 15; i++) setFunction(8, 14 - i, ((bits >>> i) & 1) !== 0);
      for (let i = 0; i < 8; i++) setFunction(8, SIZE - 1 - i, ((bits >>> i) & 1) !== 0);
      for (let i = 8; i < 15; i++) setFunction(SIZE - 15 + i, 8, ((bits >>> i) & 1) !== 0);
      setFunction(SIZE - 8, 8, true);
    };
    const versionBits = (VERSION << 12) | bch(VERSION << 12, 0x1f25);
    for (let i = 0; i < 18; i++) {
      const dark = ((versionBits >>> i) & 1) !== 0;
      const row = SIZE - 11 + (i % 3), column = Math.floor(i / 3);
      setFunction(row, column, dark);
      setFunction(column, row, dark);
    }
    format(0);

    const words = codewords(text);
    let bitIndex = 0;
    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right--;
      const upward = ((right + 1) & 2) === 0;
      for (let vertical = 0; vertical < SIZE; vertical++) {
        const row = upward ? SIZE - 1 - vertical : vertical;
        for (let side = 0; side < 2; side++) {
          const column = right - side;
          if (reserved[row][column]) continue;
          let dark = bitIndex < words.length * 8
            && ((words[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
          if ((row + column) % 2 === 0) dark = !dark;
          modules[row][column] = dark;
          bitIndex++;
        }
      }
    }
    return modules;
  }

  function toSvg(text, label) {
    const matrix = makeMatrix(text);
    const path = [];
    matrix.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) path.push(`M${x + 4} ${y + 4}h1v1h-1z`);
    }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE + 8} ${SIZE + 8}" role="img" aria-label="${String(label).replace(/[&<>"']/g, '')}"><path fill="#000" d="${path.join('')}"/></svg>`;
  }

  root.QrGenerator = {makeMatrix, toSvg, maxBytes: MAX_BYTES};
})(globalThis);
