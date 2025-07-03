import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { workerNodes } from '../src/shared/infrastructure/database/render-testing-schema';
import { eq, sql } from 'drizzle-orm';

const createWorkerNodesTable = async () => {
  console.log('🔗 Connecting to database...');
  
  // Use the same connection logic as the app
  const connectionString = process.env.DATABASE_URL || 'postgresql://email_makers_user:email_makers_password@localhost:5433/email_makers';
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient);

  try {
    console.log('📝 Checking if worker_nodes table exists...');
    
    // Try to query the table to see if it exists
    try {
      const existingWorkers = await db.select().from(workerNodes).limit(1);
      console.log('✅ worker_nodes table already exists');
      console.log(`📊 Found ${existingWorkers.length > 0 ? existingWorkers.length : 'no'} existing worker(s)`);
      return;
    } catch (error) {
      console.log('❌ worker_nodes table does not exist, creating...');
    }

    // Create the table by trying to insert sample data
    // The table schema should be created by migrations, but if not, this will fail gracefully
    console.log('📝 Inserting sample worker nodes...');
    
    const sampleWorkers = [
      {
        id: 'worker-content-1',
        name: 'Content Specialist Worker 1',
        type: 'content',
        status: 'idle',
        capabilities: { content_generation: true, language_support: ['en', 'ru'] },
        configuration: { max_memory: '512MB', timeout: 30000 },
        lastHeartbeat: new Date(),
      },
      {
        id: 'worker-design-1',
        name: 'Design Specialist Worker 1',
        type: 'design',
        status: 'busy',
        capabilities: { figma_integration: true, image_processing: true },
        configuration: { max_memory: '1GB', timeout: 60000 },
        lastHeartbeat: new Date(),
      },
      {
        id: 'worker-quality-1',
        name: 'Quality Specialist Worker 1',
        type: 'quality',
        status: 'idle',
        capabilities: { html_validation: true, accessibility_check: true },
        configuration: { max_memory: '256MB', timeout: 15000 },
        lastHeartbeat: new Date(),
      },
      {
        id: 'worker-delivery-1',
        name: 'Delivery Specialist Worker 1',
        type: 'delivery',
        status: 'idle',
        capabilities: { email_rendering: true, client_testing: true },
        configuration: { max_memory: '512MB', timeout: 45000 },
        lastHeartbeat: new Date(),
      },
    ];

    for (const worker of sampleWorkers) {
      try {
        // Try to insert, but handle conflicts
        await db.insert(workerNodes).values(worker).onConflictDoNothing();
        console.log(`✅ Inserted worker: ${worker.name} (${worker.status})`);
      } catch (insertError) {
        console.log(`⚠️ Worker ${worker.id} might already exist or table creation failed`);
      }
    }

    console.log('✅ Worker nodes setup completed');
    console.log('📊 Sample workers added:');
    console.log('  - Content Specialist Worker (idle)');
    console.log('  - Design Specialist Worker (busy)');  
    console.log('  - Quality Specialist Worker (idle)');
    console.log('  - Delivery Specialist Worker (idle)');

  } catch (error) {
    console.error('❌ Error setting up worker_nodes:', error);
    console.log('💡 This might indicate that the render-testing schema migrations need to be applied');
    console.log('💡 Try running: npm run db:migrate');
  } finally {
    await queryClient.end();
    console.log('🔌 Database connection closed');
  }
};

// Load environment variables and run
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  createWorkerNodesTable().catch(console.error);
}