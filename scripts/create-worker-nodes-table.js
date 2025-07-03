#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const createWorkerNodesTable = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Check if worker_nodes table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'worker_nodes'
      );
    `;

    const tableExists = await client.query(checkTableQuery);
    const exists = tableExists.rows[0].exists;

    if (exists) {
      console.log('✅ worker_nodes table already exists');
      return;
    }

    console.log('📝 Creating worker_nodes table...');

    // Create worker_nodes table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS worker_nodes (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'idle',
        capabilities JSONB NOT NULL,
        current_job_id UUID,
        max_concurrent_jobs INTEGER NOT NULL DEFAULT 1,
        current_job_count INTEGER NOT NULL DEFAULT 0,
        total_jobs_processed INTEGER NOT NULL DEFAULT 0,
        average_job_duration INTEGER NOT NULL DEFAULT 0,
        last_heartbeat TIMESTAMP NOT NULL DEFAULT NOW(),
        configuration JSONB NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);

    // Create indexes
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS worker_nodes_status_idx ON worker_nodes(status);
      CREATE INDEX IF NOT EXISTS worker_nodes_type_idx ON worker_nodes(type);
      CREATE INDEX IF NOT EXISTS worker_nodes_heartbeat_idx ON worker_nodes(last_heartbeat);
      CREATE INDEX IF NOT EXISTS worker_nodes_current_job_idx ON worker_nodes(current_job_id);
    `;

    await client.query(createIndexesQuery);

    // Insert some sample worker nodes
    const insertSampleDataQuery = `
      INSERT INTO worker_nodes (id, name, type, status, capabilities, configuration, last_heartbeat)
      VALUES 
        ('worker-content-1', 'Content Specialist Worker 1', 'content', 'idle', '{"content_generation": true, "language_support": ["en", "ru"]}', '{"max_memory": "512MB", "timeout": 30000}', NOW()),
        ('worker-design-1', 'Design Specialist Worker 1', 'design', 'busy', '{"figma_integration": true, "image_processing": true}', '{"max_memory": "1GB", "timeout": 60000}', NOW()),
        ('worker-quality-1', 'Quality Specialist Worker 1', 'quality', 'idle', '{"html_validation": true, "accessibility_check": true}', '{"max_memory": "256MB", "timeout": 15000}', NOW()),
        ('worker-delivery-1', 'Delivery Specialist Worker 1', 'delivery', 'idle', '{"email_rendering": true, "client_testing": true}', '{"max_memory": "512MB", "timeout": 45000}', NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    await client.query(insertSampleDataQuery);

    console.log('✅ worker_nodes table created successfully with sample data');
    console.log('📊 Sample workers added:');
    console.log('  - Content Specialist Worker (idle)');
    console.log('  - Design Specialist Worker (busy)');
    console.log('  - Quality Specialist Worker (idle)');
    console.log('  - Delivery Specialist Worker (idle)');

  } catch (error) {
    console.error('❌ Error creating worker_nodes table:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
};

createWorkerNodesTable();