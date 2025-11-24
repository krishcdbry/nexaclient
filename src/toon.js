/**
 * TOON Format Support for NexaDB Node.js Client
 * ==============================================
 *
 * Token-Oriented Object Notation (TOON) - A compact data format optimized for LLMs.
 * https://github.com/toon-format/toon
 *
 * Key Features:
 * - 40-50% fewer tokens than JSON
 * - Better LLM comprehension (73.9% vs JSON's 69.7%)
 * - Tabular arrays with explicit schemas
 * - YAML-like indentation for nested objects
 *
 * NexaDB is the FIRST database with native TOON support!
 */

class TOONSerializer {
  constructor(indentSize = 2) {
    this.indentSize = indentSize;
  }

  /**
   * Convert JavaScript object to TOON format string.
   *
   * @param {*} data - JavaScript object (JSON-like)
   * @param {number} indentLevel - Current indentation level
   * @returns {string} TOON formatted string
   */
  serialize(data, indentLevel = 0) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return this._serializeObject(data, indentLevel);
    } else if (Array.isArray(data)) {
      return this._serializeArray(data, indentLevel);
    } else {
      return this._serializePrimitive(data);
    }
  }

  _serializeObject(obj, indentLevel) {
    const lines = [];
    const indent = ' '.repeat(indentLevel * this.indentSize);

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object
        lines.push(`${indent}${key}:`);
        lines.push(this._serializeObject(value, indentLevel + 1));
      } else if (Array.isArray(value)) {
        // Array
        lines.push(`${indent}${this._serializeArrayWithKey(key, value, indentLevel)}`);
      } else {
        // Primitive
        lines.push(`${indent}${key}: ${this._serializePrimitive(value)}`);
      }
    }

    return lines.join('\n');
  }

  _serializeArrayWithKey(key, arr, indentLevel) {
    if (arr.length === 0) {
      return `${key}[0]:`;
    }

    const length = arr.length;

    // Check if uniform objects (tabular format)
    if (arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      // Get all unique keys across all objects
      const allKeys = [];
      const seen = new Set();

      for (const item of arr) {
        for (const k of Object.keys(item)) {
          if (!seen.has(k)) {
            allKeys.push(k);
            seen.add(k);
          }
        }
      }

      if (allKeys.length > 0) {
        // Tabular format: key[N]{field1,field2,...}:
        const fields = allKeys.join(',');
        const indent = ' '.repeat((indentLevel + 1) * this.indentSize);

        const lines = [`${key}[${length}]{${fields}}:`];

        // Add rows
        for (const item of arr) {
          const rowValues = allKeys.map(field =>
            this._serializePrimitive(item[field])
          );
          lines.push(`${indent}${rowValues.join(',')}`);
        }

        return lines.join('\n');
      }
    }

    // Primitive array
    if (arr.every(item => typeof item !== 'object' || item === null)) {
      const serializedItems = arr.map(item => this._serializePrimitive(item));
      return `${key}[${length}]: ${serializedItems.join(',')}`;
    }

    // Mixed array - one item per line
    const lines = [`${key}[${length}]:`];
    const indent = ' '.repeat((indentLevel + 1) * this.indentSize);
    for (const item of arr) {
      lines.push(`${indent}${this.serialize(item, indentLevel + 1)}`);
    }
    return lines.join('\n');
  }

  _serializeArray(arr, indentLevel) {
    if (arr.length === 0) {
      return '[]';
    }

    // Check if array of uniform objects (best case for TOON)
    if (arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      return this._serializeTabularArray(arr, indentLevel);
    }

    // Check if array of primitives
    if (arr.every(item => typeof item !== 'object' || item === null)) {
      const serializedItems = arr.map(item => this._serializePrimitive(item));
      return serializedItems.join(',');
    }

    // Mixed array - serialize each item on new line
    const indent = ' '.repeat(indentLevel * this.indentSize);
    const lines = [];
    for (const item of arr) {
      lines.push(`${indent}${this.serialize(item, indentLevel + 1)}`);
    }
    return lines.join('\n');
  }

  _serializeTabularArray(arr, indentLevel) {
    if (arr.length === 0) {
      return '';
    }

    // Get all unique keys
    const allKeys = [];
    const seen = new Set();

    for (const item of arr) {
      for (const k of Object.keys(item)) {
        if (!seen.has(k)) {
          allKeys.push(k);
          seen.add(k);
        }
      }
    }

    const indent = ' '.repeat(indentLevel * this.indentSize);
    const lines = [];

    for (const item of arr) {
      const rowValues = allKeys.map(field =>
        this._serializePrimitive(item[field])
      );
      lines.push(`${indent}${rowValues.join(',')}`);
    }

    return lines.join('\n');
  }

  _serializePrimitive(value) {
    if (value === null || value === undefined) {
      return 'null';
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    } else if (typeof value === 'string') {
      // Escape commas and newlines in strings
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return JSON.stringify(value);
      }
      return value;
    } else if (typeof value === 'number') {
      return String(value);
    } else {
      return String(value);
    }
  }
}

class TOONParser {
  /**
   * Parse TOON format string to JavaScript object.
   *
   * @param {string} toonStr - TOON formatted string
   * @returns {*} JavaScript object
   */
  parse(toonStr) {
    const lines = toonStr.trim().split('\n');
    const [result] = this._parseLines(lines, 0, 0);
    return result;
  }

  _parseLines(lines, startIdx, baseIndent) {
    const obj = {};
    let idx = startIdx;

    while (idx < lines.length) {
      const line = lines[idx];

      // Skip empty lines
      if (!line.trim()) {
        idx++;
        continue;
      }

      // Calculate indentation
      const indent = line.length - line.trimStart().length;

      // If indentation decreases, return (end of current object)
      if (indent < baseIndent) {
        break;
      }

      // If indentation is greater, skip (handled by nested call)
      if (indent > baseIndent) {
        idx++;
        continue;
      }

      const lineContent = line.trim();

      // Check for key-value pair
      if (lineContent.includes(':')) {
        const colonIdx = lineContent.indexOf(':');
        const key = lineContent.substring(0, colonIdx).trim();
        const valuePart = lineContent.substring(colonIdx + 1).trim();

        // Check for array declaration: key[N] or key[N]{fields}
        if (key.includes('[') && key.includes(']')) {
          const { arrayKey, meta } = this._parseArrayDeclaration(key);

          // Check if tabular array
          if (key.includes('{')) {
            // Tabular array: parse rows
            const { fields, length } = meta;
            const rows = [];
            let rowIdx = idx + 1;
            const rowIndent = indent + 2;

            while (rowIdx < lines.length && rows.length < length) {
              const rowLine = lines[rowIdx];
              const rowLineIndent = rowLine.length - rowLine.trimStart().length;

              if (rowLineIndent >= rowIndent && rowLine.trim()) {
                const rowValues = this._parseCSVRow(rowLine.trim());

                // Map values to fields
                const rowObj = {};
                fields.forEach((field, fieldIdx) => {
                  if (fieldIdx < rowValues.length) {
                    rowObj[field] = this._parsePrimitive(rowValues[fieldIdx]);
                  }
                });

                rows.push(rowObj);
              }

              rowIdx++;
            }

            obj[arrayKey] = rows;
            idx = rowIdx;
            continue;
          } else {
            // Primitive array: key[N]: val1,val2,val3
            if (valuePart) {
              const values = this._parseCSVRow(valuePart);
              obj[arrayKey] = values.map(v => this._parsePrimitive(v));
            } else {
              obj[arrayKey] = [];
            }
            idx++;
            continue;
          }
        } else if (!valuePart) {
          // Key without value - check if next line is indented (nested object)
          if (idx + 1 < lines.length) {
            const nextIndent = lines[idx + 1].length - lines[idx + 1].trimStart().length;
            if (nextIndent > indent) {
              const [nestedObj, nextIdx] = this._parseLines(lines, idx + 1, indent + 2);
              obj[key] = nestedObj;
              idx = nextIdx;
              continue;
            }
          }
        }

        // Regular key-value
        if (valuePart) {
          obj[key] = this._parsePrimitive(valuePart);
        }

        idx++;
      } else {
        idx++;
      }
    }

    return [obj, idx];
  }

  _parseArrayDeclaration(keyStr) {
    // Extract key
    const key = keyStr.substring(0, keyStr.indexOf('['));

    // Extract length
    const lengthStart = keyStr.indexOf('[') + 1;
    const lengthEnd = keyStr.indexOf(']');
    const length = parseInt(keyStr.substring(lengthStart, lengthEnd));

    const meta = { length, fields: null };

    // Check for fields
    if (keyStr.includes('{')) {
      const fieldsStart = keyStr.indexOf('{') + 1;
      const fieldsEnd = keyStr.indexOf('}');
      const fieldsStr = keyStr.substring(fieldsStart, fieldsEnd);
      meta.fields = fieldsStr.split(',').map(f => f.trim());
    }

    return { arrayKey: key, meta };
  }

  _parseCSVRow(rowStr) {
    // Simple CSV parsing
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of rowStr) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      values.push(current.trim());
    }

    return values;
  }

  _parsePrimitive(valueStr) {
    valueStr = valueStr.trim();

    // Handle quoted strings
    if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
      return JSON.parse(valueStr);
    }

    // Boolean
    if (valueStr === 'true') {
      return true;
    } else if (valueStr === 'false') {
      return false;
    }

    // Null
    if (valueStr === 'null') {
      return null;
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
      return valueStr.includes('.') ? parseFloat(valueStr) : parseInt(valueStr);
    }

    // String
    return valueStr;
  }
}

/**
 * Convert JSON to TOON format.
 *
 * @param {string|object|array} jsonData - JSON string or JavaScript object
 * @returns {string} TOON formatted string
 */
function jsonToToon(jsonData) {
  const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
  const serializer = new TOONSerializer();
  return serializer.serialize(data);
}

/**
 * Convert TOON to JSON format.
 *
 * @param {string} toonData - TOON formatted string
 * @returns {string} JSON formatted string
 */
function toonToJson(toonData) {
  const parser = new TOONParser();
  const data = parser.parse(toonData);
  return JSON.stringify(data, null, 2);
}

module.exports = {
  TOONSerializer,
  TOONParser,
  jsonToToon,
  toonToJson
};
