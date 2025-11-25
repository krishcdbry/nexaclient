/**
 * NexaClient - Official JavaScript client for NexaDB
 *
 * High-performance binary protocol client for NexaDB with:
 * - Binary protocol (3-10x faster than HTTP/REST)
 * - MessagePack encoding (2-10x faster than JSON)
 * - Persistent TCP connections
 * - Connection pooling
 * - Automatic reconnection
 *
 * Usage:
 *   const NexaClient = require('nexaclient');
 *
 *   const db = new NexaClient({
 *     host: 'localhost',
 *     port: 6970,
 *     username: 'root',
 *     password: 'nexadb123'
 *   });
 *   await db.connect();
 *
 *   const user = await db.create('users', {
 *     name: 'John',
 *     email: 'john@example.com'
 *   });
 *
 *   await db.disconnect();
 */

const net = require('net');
const msgpack = require('msgpack-lite');
const EventEmitter = require('events');
const { jsonToToon, toonToJson } = require('./toon');

// Protocol constants
const MAGIC = 0x4E455841;  // "NEXA"
const VERSION = 0x01;

// Client → Server message types
const MSG_CONNECT = 0x01;
const MSG_CREATE = 0x02;
const MSG_READ = 0x03;
const MSG_UPDATE = 0x04;
const MSG_DELETE = 0x05;
const MSG_QUERY = 0x06;
const MSG_VECTOR_SEARCH = 0x07;
const MSG_BATCH_WRITE = 0x08;
const MSG_PING = 0x09;
const MSG_DISCONNECT = 0x0A;
const MSG_QUERY_TOON = 0x0B;
const MSG_EXPORT_TOON = 0x0C;

// Server → Client response types
const MSG_SUCCESS = 0x81;
const MSG_ERROR = 0x82;
const MSG_NOT_FOUND = 0x83;
const MSG_DUPLICATE = 0x84;
const MSG_PONG = 0x88;


class NexaClient extends EventEmitter {
  /**
   * Create NexaDB client.
   *
   * @param {Object} options - Client options
   * @param {string} options.host - Server host (default: 'localhost')
   * @param {number} options.port - Server port (default: 6970)
   * @param {string} options.username - Username for authentication (default: 'root')
   * @param {string} options.password - Password for authentication (default: 'nexadb123')
   * @param {number} options.timeout - Connection timeout in ms (default: 30000)
   * @param {boolean} options.autoReconnect - Auto-reconnect on disconnect (default: true)
   */
  constructor(options = {}) {
    super();

    this.host = options.host || 'localhost';
    this.port = options.port || 6970;
    this.username = options.username || 'root';
    this.password = options.password || 'nexadb123';
    this.timeout = options.timeout || 30000;
    this.autoReconnect = options.autoReconnect !== false;

    this.socket = null;
    this.connected = false;
    this.connecting = false;

    // Pending requests (for request/response matching)
    this.pendingRequests = [];
    this.requestId = 0;

    // Buffer for incomplete messages
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Connect to NexaDB server.
   *
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connected) {
      return;
    }

    if (this.connecting) {
      // Wait for ongoing connection
      return new Promise((resolve, reject) => {
        this.once('connect', resolve);
        this.once('error', reject);
      });
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Connection timeout after ${this.timeout}ms`));
        this.socket?.destroy();
      }, this.timeout);

      this.socket = net.createConnection({
        host: this.host,
        port: this.port
      });

      this.socket.on('connect', () => {
        clearTimeout(timeoutId);
        this.connected = true;
        this.connecting = false;
        this.emit('connect');

        // Send handshake
        this._sendConnect().then(() => {
          resolve();
        }).catch(reject);
      });

      this.socket.on('data', (data) => {
        this._handleData(data);
      });

      this.socket.on('error', (err) => {
        clearTimeout(timeoutId);
        this.connecting = false;
        this.connected = false;
        this.emit('error', err);
        reject(err);
      });

      this.socket.on('close', () => {
        this.connected = false;
        this.emit('disconnect');

        // Reject all pending requests
        this.pendingRequests.forEach(req => {
          req.reject(new Error('Connection closed'));
        });
        this.pendingRequests = [];

        // Auto-reconnect
        if (this.autoReconnect && !this.connecting) {
          setTimeout(() => {
            this.connect().catch(err => {
              this.emit('error', err);
            });
          }, 1000);
        }
      });
    });
  }

  /**
   * Disconnect from server.
   *
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.autoReconnect = false;

    if (this.socket) {
      return new Promise((resolve) => {
        this.socket.once('close', resolve);
        this.socket.end();
      });
    }
  }

  /**
   * Send authentication handshake.
   *
   * @private
   */
  async _sendConnect() {
    return this._sendMessage(MSG_CONNECT, {
      username: this.username,
      password: this.password
    });
  }

  /**
   * Create document in collection.
   *
   * @param {string} collection - Collection name
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(collection, data) {
    const response = await this._sendMessage(MSG_CREATE, {
      collection,
      data
    });

    return response;
  }

  /**
   * Get document by ID.
   *
   * @param {string} collection - Collection name
   * @param {string} key - Document ID
   * @returns {Promise<Object|null>} Document or null if not found
   */
  async get(collection, key) {
    try {
      const response = await this._sendMessage(MSG_READ, {
        collection,
        key
      });
      return response.document;
    } catch (err) {
      if (err.message.includes('Not found')) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Update document.
   *
   * @param {string} collection - Collection name
   * @param {string} key - Document ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async update(collection, key, updates) {
    return this._sendMessage(MSG_UPDATE, {
      collection,
      key,
      updates
    });
  }

  /**
   * Delete document.
   *
   * @param {string} collection - Collection name
   * @param {string} key - Document ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(collection, key) {
    return this._sendMessage(MSG_DELETE, {
      collection,
      key
    });
  }

  /**
   * Query documents with filters.
   *
   * @param {string} collection - Collection name
   * @param {Object} filters - Query filters
   * @param {number} limit - Max results (default: 100)
   * @returns {Promise<Array>} Matching documents
   */
  async query(collection, filters = {}, limit = 100) {
    const response = await this._sendMessage(MSG_QUERY, {
      collection,
      filters,
      limit
    });

    return response.documents || [];
  }

  /**
   * Vector similarity search.
   *
   * @param {string} collection - Collection name
   * @param {Array<number>} vector - Query vector
   * @param {number} limit - Max results (default: 10)
   * @param {number} dimensions - Vector dimensions (default: 768)
   * @returns {Promise<Array>} Similar documents
   */
  async vectorSearch(collection, vector, limit = 10, dimensions = 768) {
    const response = await this._sendMessage(MSG_VECTOR_SEARCH, {
      collection,
      vector,
      limit,
      dimensions
    });

    return response.results || [];
  }

  /**
   * Bulk insert documents.
   *
   * @param {string} collection - Collection name
   * @param {Array<Object>} documents - Documents to insert
   * @returns {Promise<Object>} Insert result
   */
  async batchWrite(collection, documents) {
    return this._sendMessage(MSG_BATCH_WRITE, {
      collection,
      documents
    });
  }

  /**
   * Ping server (keep-alive).
   *
   * @returns {Promise<Object>} Pong response
   */
  async ping() {
    return this._sendMessage(MSG_PING, {});
  }

  /**
   * Query documents with TOON format response.
   * TOON format reduces token count by 40-50% for LLM applications.
   *
   * @param {string} collection - Collection name
   * @param {Object} filters - Query filters
   * @param {number} limit - Max results (default: 100)
   * @returns {Promise<Object>} Response with TOON data and token stats
   */
  async queryToon(collection, filters = {}, limit = 100) {
    return this._sendMessage(MSG_QUERY_TOON, {
      collection,
      filters,
      limit
    });
  }

  /**
   * Export entire collection to TOON format.
   * Perfect for AI/ML pipelines that need efficient data transfer.
   *
   * @param {string} collection - Collection name
   * @returns {Promise<Object>} Response with TOON data and token stats
   */
  async exportToon(collection) {
    return this._sendMessage(MSG_EXPORT_TOON, {
      collection
    });
  }

  /**
   * Send binary message and wait for response.
   *
   * @private
   * @param {number} msgType - Message type
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Response data
   */
  _sendMessage(msgType, data) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error('Not connected to NexaDB'));
      }

      // Encode payload with MessagePack
      const payload = msgpack.encode(data);

      // Build header (12 bytes)
      const header = Buffer.alloc(12);
      header.writeUInt32BE(MAGIC, 0);            // Magic
      header.writeUInt8(VERSION, 4);             // Version
      header.writeUInt8(msgType, 5);             // Message type
      header.writeUInt16BE(0, 6);                // Flags
      header.writeUInt32BE(payload.length, 8);   // Payload length

      // Send header + payload
      const message = Buffer.concat([header, payload]);
      this.socket.write(message);

      // Add to pending requests
      const requestId = this.requestId++;
      this.pendingRequests.push({
        id: requestId,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Handle incoming data from socket.
   *
   * @private
   * @param {Buffer} data - Incoming data
   */
  _handleData(data) {
    // Append to buffer
    this.buffer = Buffer.concat([this.buffer, data]);

    // Process complete messages
    while (this.buffer.length >= 12) {
      // Read header (12 bytes)
      const magic = this.buffer.readUInt32BE(0);
      const version = this.buffer.readUInt8(4);
      const msgType = this.buffer.readUInt8(5);
      const payloadLen = this.buffer.readUInt32BE(8);

      // Check if we have the full message
      if (this.buffer.length < 12 + payloadLen) {
        break;  // Wait for more data
      }

      // Verify magic
      if (magic !== MAGIC) {
        this.emit('error', new Error(`Invalid protocol magic: ${magic.toString(16)}`));
        this.socket.destroy();
        return;
      }

      // Extract payload
      const payloadBuf = this.buffer.slice(12, 12 + payloadLen);
      this.buffer = this.buffer.slice(12 + payloadLen);

      // Decode MessagePack
      try {
        const payload = msgpack.decode(payloadBuf);
        this._handleMessage(msgType, payload);
      } catch (err) {
        this.emit('error', new Error(`Failed to decode MessagePack: ${err.message}`));
      }
    }
  }

  /**
   * Handle decoded message.
   *
   * @private
   * @param {number} msgType - Message type
   * @param {Object} data - Message data
   */
  _handleMessage(msgType, data) {
    // Get pending request
    const request = this.pendingRequests.shift();

    if (!request) {
      // Unsolicited message
      this.emit('message', { type: msgType, data });
      return;
    }

    // Handle response type
    if (msgType === MSG_SUCCESS || msgType === MSG_PONG) {
      request.resolve(data);
    } else if (msgType === MSG_ERROR) {
      request.reject(new Error(data.error || 'Unknown error'));
    } else if (msgType === MSG_NOT_FOUND) {
      request.reject(new Error('Not found'));
    } else {
      request.reject(new Error(`Unknown response type: ${msgType}`));
    }
  }
}

module.exports = NexaClient;
module.exports.jsonToToon = jsonToToon;
module.exports.toonToJson = toonToJson;
