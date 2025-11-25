/**
 * Basic usage example for NexaClient
 */

const NexaClient = require('../src/index');

async function main() {
  console.log('='.repeat(60));
  console.log('NexaClient - Basic Usage Example');
  console.log('='.repeat(60));

  // Create client
  const db = new NexaClient({
    host: 'localhost',
    port: 6970,
    username: 'root',
    password: 'nexadb123'
  });

  try {
    // Connect
    console.log('\n1️⃣  Connecting to NexaDB...');
    await db.connect();
    console.log('✅ Connected!');

    // Create user
    console.log('\n2️⃣  Creating user...');
    const createResult = await db.create('users', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 28,
      role: 'developer'
    });
    console.log('✅ User created:', createResult);

    const userId = createResult.document_id;

    // Get user
    console.log('\n3️⃣  Getting user...');
    const user = await db.get('users', userId);
    console.log('✅ User retrieved:', user);

    // Update user
    console.log('\n4️⃣  Updating user...');
    await db.update('users', userId, {
      age: 29,
      department: 'Engineering'
    });
    console.log('✅ User updated');

    // Get updated user
    const updatedUser = await db.get('users', userId);
    console.log('📝 Updated user:', updatedUser);

    // Create more users
    console.log('\n5️⃣  Creating more users...');
    await db.batchWrite('users', [
      { name: 'Bob Smith', email: 'bob@example.com', age: 35, role: 'manager' },
      { name: 'Carol White', email: 'carol@example.com', age: 42, role: 'director' },
      { name: 'David Brown', email: 'david@example.com', age: 31, role: 'developer' }
    ]);
    console.log('✅ Batch insert complete');

    // Query users
    console.log('\n6️⃣  Querying users...');
    const developers = await db.query('users', { role: 'developer' }, 10);
    console.log(`✅ Found ${developers.length} developers:`, developers);

    // Ping server
    console.log('\n7️⃣  Pinging server...');
    const pong = await db.ping();
    console.log('✅ Ping successful:', pong);

    // Delete user
    console.log('\n8️⃣  Deleting user...');
    await db.delete('users', userId);
    console.log('✅ User deleted');

    // Verify deletion
    const deletedUser = await db.get('users', userId);
    console.log('📝 User after deletion:', deletedUser);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All operations completed successfully!');
    console.log('='.repeat(60));
    console.log('\nPerformance Benefits:');
    console.log('  - 3-10x faster than HTTP/REST');
    console.log('  - Binary protocol with MessagePack');
    console.log('  - Persistent TCP connections');
    console.log('  - Automatic reconnection');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    // Disconnect
    console.log('\n9️⃣  Disconnecting...');
    await db.disconnect();
    console.log('✅ Disconnected\n');
  }
}

main();
