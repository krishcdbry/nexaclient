# Publishing NexaClient to NPM

This guide explains how to publish the `nexaclient` package to the NPM registry.

## Prerequisites

1. **NPM Account**
   - Create account at https://www.npmjs.com/signup
   - Verify your email address

2. **NPM CLI Login**
   ```bash
   npm login
   # Enter your username, password, and email
   ```

3. **Check Package Name Availability**
   ```bash
   npm search nexaclient
   # If nothing found, the name is available
   ```

## Publishing Steps

### 1. Final Testing

Before publishing, ensure everything works:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Expected output: ✅ All operations completed successfully!
```

### 2. Update Version (if needed)

```bash
# For patch release (1.0.0 -> 1.0.1)
npm version patch

# For minor release (1.0.0 -> 1.1.0)
npm version minor

# For major release (1.0.0 -> 2.0.0)
npm version major
```

### 3. Publish to NPM

**For first-time publish:**
```bash
npm publish
```

**For scoped packages (if using @yourorg/nexaclient):**
```bash
npm publish --access public
```

### 4. Verify Publication

```bash
# Check package info
npm info nexaclient

# Expected output:
# nexaclient@1.0.0 | MIT | deps: 1 | versions: 1
# Official JavaScript client for NexaDB
# https://github.com/krishcdbry/nexaclient#readme
```

### 5. Test Installation

```bash
# In a new directory
mkdir test-nexaclient
cd test-nexaclient
npm init -y
npm install nexaclient

# Test it
node -e "const NexaClient = require('nexaclient'); console.log(NexaClient)"
```

## Post-Publishing

### 1. Update Repository

Add NPM badge to README.md:

```markdown
[![npm version](https://badge.fury.io/js/nexaclient.svg)](https://www.npmjs.com/package/nexaclient)
[![npm downloads](https://img.shields.io/npm/dm/nexaclient.svg)](https://www.npmjs.com/package/nexaclient)
```

### 2. Create GitHub Release

Go to https://github.com/krishcdbry/nexaclient/releases and create a new release:
- Tag: `v1.0.0`
- Title: `NexaClient v1.0.0 - Initial Release`
- Description: Copy from CHANGELOG.md

### 3. Update Main NexaDB Repo

Update `/Users/krish/krishx/nexadb/README.md` to mention the NPM package:

```markdown
## Installation

### NPM Client (Recommended)

```bash
npm install nexaclient
```

### HTTP Client

```bash
npm install axios
```
```

### 4. Announce Release

**Twitter/X:**
```
🚀 Announcing NexaClient v1.0.0!

Official JavaScript client for NexaDB with binary protocol support.

✅ 3-10x faster than HTTP/REST
✅ MessagePack encoding
✅ Persistent TCP connections
✅ Auto-reconnection

npm install nexaclient

https://github.com/krishcdbry/nexaclient
```

**Dev.to / Hashnode:**
Write a blog post: "Building a High-Performance Binary Protocol Client for NexaDB"

## Package Information

**Current Status:**
- ✅ Package ready to publish
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Examples included
- ✅ GitHub repo created
- ✅ v1.0.0 tag created

**Package Details:**
- Name: `nexaclient`
- Version: `1.0.0`
- License: MIT
- Repository: https://github.com/krishcdbry/nexaclient
- Main: `src/index.js`
- Dependencies: `msgpack-lite`

**Install Command (after publishing):**
```bash
npm install nexaclient
```

## Future Versions

### v1.1.0 (Planned)
- TypeScript definitions (.d.ts files)
- Connection pool management
- Retry logic with exponential backoff
- Request timeout configuration

### v1.2.0 (Planned)
- Streaming large result sets
- Compression support
- Custom serialization options
- Performance monitoring hooks

### v2.0.0 (Future)
- Full TypeScript rewrite
- WebSocket fallback
- Browser support (via browserify/webpack)
- Clustering support

## Maintenance

### Updating Package

1. Make changes
2. Update version: `npm version patch/minor/major`
3. Update CHANGELOG.md
4. Commit: `git commit -am "Release vX.X.X"`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`

### Deprecating Package

```bash
npm deprecate nexaclient@1.0.0 "Use version 1.1.0 or higher"
```

### Unpublishing (within 72 hours only)

```bash
npm unpublish nexaclient@1.0.0
```

## Support

For publishing issues:
- NPM Support: https://www.npmjs.com/support
- Documentation: https://docs.npmjs.com/

## Checklist

Before publishing v1.0.0:
- [x] Package name available
- [x] All tests passing
- [x] README complete
- [x] Examples working
- [x] CHANGELOG created
- [x] GitHub repo created
- [x] Git tag created
- [ ] NPM account created
- [ ] Logged in to NPM
- [ ] Published to NPM
- [ ] GitHub release created
- [ ] Announced on social media

## Commands Reference

```bash
# Login to NPM
npm login

# Publish package
npm publish

# Check published package
npm info nexaclient

# Test installation
npm install -g nexaclient

# View package page
open https://www.npmjs.com/package/nexaclient
```

---

**Ready to publish!** 🚀

Just run `npm publish` when you're ready to make it available to the world.
