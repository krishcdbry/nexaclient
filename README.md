# NexaClient

Official JavaScript client for NexaDB v3.0.0 - The high-performance, easy-to-use database.

## Features

- **Multi-database support** - Manage multiple isolated databases in one instance (NEW in v3.0.0)
- **3-10x faster than HTTP/REST** - Binary protocol with MessagePack encoding
- **Persistent TCP connections** - No HTTP overhead
- **Automatic reconnection** - Built-in connection management
- **Connection pooling** - Handle 1000+ concurrent operations
- **Vector search** - Built-in HNSW vector similarity search
- **TOON format** - 40-50% token reduction for LLM applications
- **Promise-based API** - Modern async/await syntax

## Installation

```bash
npm install nexaclient
```

## Quick Start

```javascript
const NexaClient = require('nexaclient');

// Create client
const db = new NexaClient({
  host: 'localhost',
  port: 6970,
  username: 'root',
  password: 'nexadb123'
});

// Connect
await db.connect();

// Create document
const user = await db.create('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Get document
const found = await db.get('users', user.document_id);

// Update document
await db.update('users', user.document_id, {
  age: 30
});

// Query documents
const results = await db.query('users', { age: { $gte: 25 } });

// Delete document
await db.delete('users', user.document_id);

// Disconnect
await db.disconnect();
```

## API Reference

### Constructor

```javascript
const db = new NexaClient(options);
```

**Options:**
- `host` (string) - Server host (default: 'localhost')
- `port` (number) - Server port (default: 6970)
- `username` (string) - Username for authentication (default: 'root')
- `password` (string) - Password for authentication (default: 'nexadb123')
- `timeout` (number) - Connection timeout in ms (default: 30000)
- `autoReconnect` (boolean) - Auto-reconnect on disconnect (default: true)

### Methods

#### `connect()`

Connect to NexaDB server.

```javascript
await db.connect();
```

#### `create(collection, data)`

Create document in collection.

```javascript
const result = await db.create('users', {
  name: 'Alice',
  email: 'alice@example.com'
});
// Returns: { collection: 'users', document_id: '...', message: '...' }
```

#### `get(collection, key)`

Get document by ID.

```javascript
const user = await db.get('users', userId);
// Returns: { _id: '...', name: 'Alice', email: '...' } or null
```

#### `update(collection, key, updates)`

Update document.

```javascript
await db.update('users', userId, {
  age: 30,
  department: 'Engineering'
});
```

#### `delete(collection, key)`

Delete document.

```javascript
await db.delete('users', userId);
```

#### `query(collection, filters, limit)`

Query documents with filters.

```javascript
const results = await db.query('users', {
  role: 'developer',
  age: { $gte: 25 }
}, 100);
// Returns: [{ _id: '...', name: '...', ... }, ...]
```

#### `batchWrite(collection, documents)`

Bulk insert documents.

```javascript
await db.batchWrite('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Carol', email: 'carol@example.com' }
]);
```

#### `vectorSearch(collection, vector, limit, dimensions)`

Vector similarity search (for AI/ML applications).

```javascript
const results = await db.vectorSearch('embeddings', [0.1, 0.2, ...], 10, 768);
// Returns: [{ document_id: '...', similarity: 0.95, document: {...} }, ...]
```

#### `ping()`

Ping server (keep-alive).

```javascript
const pong = await db.ping();
```

#### `disconnect()`

Disconnect from server.

```javascript
await db.disconnect();
```

## Events

NexaClient extends EventEmitter and emits the following events:

- `connect` - Connected to server
- `disconnect` - Disconnected from server
- `error` - Connection or protocol error
- `message` - Unsolicited message from server

```javascript
db.on('connect', () => {
  console.log('Connected to NexaDB');
});

db.on('error', (err) => {
  console.error('Error:', err);
});

db.on('disconnect', () => {
  console.log('Disconnected from NexaDB');
});
```

## Performance

NexaClient uses a custom binary protocol for maximum performance:

| Metric | HTTP/REST | NexaClient (Binary) | Improvement |
|--------|-----------|---------------------|-------------|
| Latency | 5-10ms | 1-2ms | 3-5x faster |
| Throughput | 1K ops/sec | 5-10K ops/sec | 5-10x faster |
| Bandwidth | 300KB | 62KB | 80% less |

## Examples

See the [examples/](examples/) directory for more usage examples:

- `basic.js` - Basic CRUD operations
- `bulk.js` - Bulk insert performance (coming soon)
- `query.js` - Advanced queries (coming soon)
- `vectors.js` - Vector search (coming soon)

## Requirements

- Node.js >= 12.0.0
- NexaDB server running on localhost:6970 (or custom host/port)

## NexaDB vs MongoDB

| Feature | MongoDB | NexaDB |
|---------|---------|---------|
| Setup | 15 min | 2 min (`brew install nexadb`) |
| Write speed | ~50K/s | ~89K/s |
| Memory | 2-4 GB | 111 MB |
| Protocol | Custom binary | Custom binary |
| Client | Native drivers | **NexaClient** (this package) |

## License

MIT

## Links

- [NexaDB GitHub](https://github.com/krishcdbry/nexadb)
- [Documentation](https://nexadb.io/docs)
- [Issues](https://github.com/krishcdbry/nexaclient/issues)

## Multi-Database Support (v3.0.0)

```javascript
// Create and manage multiple databases
await db.createDatabase('tenant_acme');
await db.createDatabase('tenant_globex');

// Insert data into specific database
await db.create('users', { name: 'Alice' }, { database: 'tenant_acme' });
await db.create('users', { name: 'Bob' }, { database: 'tenant_globex' });

// Query from specific database
const acmeUsers = await db.query('users', {}, { database: 'tenant_acme' });
const globexUsers = await db.query('users', {}, { database: 'tenant_globex' });

// List all databases
const databases = await db.listDatabases();
```

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## Support

For support, please:
- Open an issue on [GitHub](https://github.com/krishcdbry/nexaclient/issues)
- Website: https://nexadb.io
- Email: krishcdbry@gmail.com
