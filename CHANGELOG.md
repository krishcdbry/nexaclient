# Changelog

All notable changes to NexaClient will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-24

### Added
- Initial release of NexaClient
- Binary protocol support with MessagePack encoding
- Persistent TCP connections for 3-10x performance improvement over HTTP/REST
- Automatic reconnection on connection loss
- Promise-based API with async/await support
- EventEmitter for connection events (connect, disconnect, error)
- Full CRUD operations:
  - `create(collection, data)` - Insert document
  - `get(collection, key)` - Get document by ID
  - `update(collection, key, updates)` - Update document
  - `delete(collection, key)` - Delete document
- Advanced operations:
  - `query(collection, filters, limit)` - Query with filters
  - `batchWrite(collection, documents)` - Bulk insert
  - `vectorSearch(collection, vector, limit, dimensions)` - Vector similarity search
  - `ping()` - Keep-alive / health check
- Connection management:
  - `connect()` - Connect to NexaDB server
  - `disconnect()` - Graceful disconnect
- Comprehensive documentation and examples
- Full test coverage with all tests passing

### Performance
- Latency: 1-2ms (vs 5-10ms with HTTP/REST)
- Throughput: 5-10K ops/sec (vs 1K with HTTP)
- Bandwidth: 80% reduction vs HTTP/JSON
- Connection pooling support

### Documentation
- Complete README with API reference
- Usage examples in `examples/basic.js`
- Performance comparison tables
- Migration guide from HTTP client

[1.0.0]: https://github.com/krishcdbry/nexaclient/releases/tag/v1.0.0
