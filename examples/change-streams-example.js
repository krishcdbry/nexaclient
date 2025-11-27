#!/usr/bin/env node
/**
 * NexaDB Change Streams Example (npm Package)
 * =============================================
 *
 * This example shows how to use NexaDB change streams with the official npm package.
 *
 * Install:
 *   npm install nexaclient
 *
 * Run:
 *   node change-streams-example.js
 */

const NexaClient = require('nexaclient');

console.log('='.repeat(70));
console.log('NexaDB Change Streams Example');
console.log('='.repeat(70));

async function main() {
  // Connect to NexaDB (can be remote!)
  const client = new NexaClient({
    host: 'localhost',
    port: 6970,
    username: 'root',
    password: 'nexadb123'
  });

  console.log('\n[1/2] Connecting to NexaDB...');
  await client.connect();
  console.log('✅ Connected!');

  console.log('\n[2/2] Watching for changes on \'orders\' collection...');
  console.log('   (Keep this running, then insert orders in another terminal)\n');

  // Watch for changes - just like MongoDB!
  try {
    for await (const change of client.watch('orders')) {
      const operation = change.operationType;
      const collection = change.ns.coll;

      if (operation === 'insert') {
        const doc = change.fullDocument || {};
        console.log('\n✅ NEW ORDER:');
        console.log(`   Customer: ${doc.customer || 'Unknown'}`);
        console.log(`   Total: $${(doc.total || 0).toFixed(2)}`);
        console.log(`   Order ID: ${change.documentKey._id}`);
      } else if (operation === 'update') {
        const docId = change.documentKey._id;
        const updates = change.updateDescription?.updatedFields || {};
        console.log('\n🔄 ORDER UPDATED:');
        console.log(`   Order ID: ${docId}`);
        console.log(`   Changes: ${JSON.stringify(updates)}`);
      } else if (operation === 'delete') {
        const docId = change.documentKey._id;
        console.log('\n❌ ORDER DELETED:');
        console.log(`   Order ID: ${docId}`);
      }
    }
  } catch (err) {
    if (err.message === 'Connection closed') {
      console.log('\n\n👋 Stopped watching. Goodbye!');
    } else {
      console.error('\nError:', err.message);
    }
  } finally {
    await client.disconnect();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopped watching. Goodbye!');
  process.exit(0);
});

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
