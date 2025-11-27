# NexaClient JavaScript v2.3.0 - Change Streams Support

## New Features

### MongoDB-Style Change Streams

Added support for real-time change notifications over the network!

**Key Features:**
- Watch for database changes in real-time
- MongoDB-compatible API using async generators
- Works over network (no filesystem access needed)
- Can connect to remote NexaDB servers
- Filter by collection and operation type

**Usage:**

```javascript
const NexaClient = require('nexaclient');

// Connect to NexaDB
const client = new NexaClient({
  host: 'localhost',
  port: 6970,
  username: 'root',
  password: 'nexadb123'
});
await client.connect();

// Watch for changes
for await (const change of client.watch('orders')) {
  if (change.operationType === 'insert') {
    console.log('New order:', change.fullDocument);
  }
}
```

**Examples:**
- `examples/change-streams-example.js` - Complete working example

## API Changes

### New Methods

- `client.watch(collection, operations)` - Watch for database changes (async generator)

### New Message Types

- `MSG_SUBSCRIBE_CHANGES = 0x30` - Subscribe to change streams
- `MSG_UNSUBSCRIBE_CHANGES = 0x31` - Unsubscribe from change streams
- `MSG_CHANGE_EVENT = 0x90` - Change event notification

### New Events

- `change` event - Emitted when a database change occurs (used internally by watch())

## Change Event Format

All change events follow MongoDB's format:

```javascript
{
  operationType: 'insert',  // insert, update, delete, dropCollection
  ns: {
    db: 'nexadb',
    coll: 'orders'
  },
  documentKey: {
    _id: 'abc123def456'
  },
  fullDocument: {  // Only for insert/update
    _id: 'abc123def456',
    customer: 'Alice',
    total: 99.99,
    _created_at: '2025-11-27T...',
    _updated_at: '2025-11-27T...'
  },
  updateDescription: {  // Only for update
    updatedFields: {
      status: 'shipped',
      tracking: 'XYZ123'
    }
  },
  timestamp: 1700000000.123
}
```

## Use Cases

Perfect for:
- Real-time notifications
- Cache invalidation
- Audit logging
- Data synchronization
- Analytics pipelines
- Event-driven architectures
- Microservices communication
- Real-time dashboards
- Workflow automation

## Requirements

- NexaDB v1.3.0 or higher
- Node.js 12.0.0+
- msgpack-lite ^0.1.26

## Installation

```bash
npm install nexaclient@2.3.0
```

## Documentation

For complete documentation, see:
- Main NexaDB docs: https://github.com/krishcdbry/nexadb
- Change streams guide: `CHANGE_STREAMS_NETWORK.md` in main repo
