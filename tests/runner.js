const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

class TestRunner {
  constructor() {
    this.devProcess = null;
    this.testResults = [];
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async checkServerReady(url = 'http://localhost:3000', timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(url, (res) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              reject(new Error(`Server returned status ${res.statusCode}`));
            }
          });
          
          req.on('error', reject);
          req.setTimeout(2000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        });
        
        console.log('✅ Server is ready!');
        return true;
      } catch (error) {
        console.log('⏳ Waiting for server...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('❌ Server failed to start within timeout');
  }

  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    // Kill any existing processes on port 3000
    try {
      const killProcess = spawn('npx', ['kill-port', '3000'], { stdio: 'pipe' });
      await new Promise(resolve => killProcess.on('close', resolve));
    } catch (error) {
      // Ignore errors from kill-port
    }
    
    const devCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    this.devProcess = spawn(devCommand, ['dev-bg'], {
      stdio: 'pipe',
      detached: false,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    this.devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('Ready')) {
        console.log('📡 Dev server output:', output.trim());
      }
    });

    this.devProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('Warning') && !error.includes('Note:')) {
        console.error('⚠️  Dev server error:', error.trim());
      }
    });

    // Wait for server to be ready
    await this.checkServerReady();
  }

  async stopDevServer() {
    if (this.devProcess) {
      console.log('🛑 Stopping development server...');
      
      // Kill the process group to ensure all child processes are terminated
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', this.devProcess.pid, '/f', '/t']);
      } else {
        this.devProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds if it doesn't stop gracefully
        setTimeout(() => {
          if (this.devProcess && !this.devProcess.killed) {
            this.devProcess.kill('SIGKILL');
          }
        }, 5000);
      }
      
      this.devProcess = null;
    }
  }

  async runIntegrationTests() {
    console.log('🧪 Running integration tests...');
    
    const TestSuite = require('./integration/taskList.test.js');
    const testSuite = new TestSuite();
    
    try {
      await testSuite.runAllTests();
      return true;
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      return false;
    }
  }

  async runWithRetries() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`\n🔄 Test Attempt ${attempt}/${this.maxRetries}`);
      console.log('='.repeat(50));
      
      try {
        await this.startDevServer();
        
        // Give the server a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const testsPassed = await this.runIntegrationTests();
        
        if (testsPassed) {
          console.log(`\n🎉 All tests passed on attempt ${attempt}!`);
          return true;
        }
        
        if (attempt < this.maxRetries) {
          console.log(`\n⏳ Retrying in 3 seconds... (${this.maxRetries - attempt} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`💥 Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          console.log(`\n⏳ Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } finally {
        await this.stopDevServer();
        
        // Clean up between attempts
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`\n❌ All ${this.maxRetries} attempts failed`);
    return false;
  }

  async cleanup() {
    await this.stopDevServer();
    
    // Final cleanup
    console.log('🧹 Cleaning up...');
    
    // Kill any remaining processes
    try {
      if (process.platform !== 'win32') {
        spawn('pkill', ['-f', 'convex'], { stdio: 'ignore' });
        spawn('pkill', ['-f', 'next'], { stdio: 'ignore' });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  const runner = new TestRunner();
  let success = false;
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n⚡ Received SIGINT, cleaning up...');
    await runner.cleanup();
    process.exit(1);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n⚡ Received SIGTERM, cleaning up...');
    await runner.cleanup();
    process.exit(1);
  });
  
  try {
    console.log('🔧 Starting CI Integration Check...');
    console.log('=====================================');
    
    success = await runner.runWithRetries();
    
    if (success) {
      console.log('\n✅ CI Integration Check: PASSED');
      console.log('All tests are working correctly! 🚀');
    } else {
      console.log('\n❌ CI Integration Check: FAILED');
      console.log('Some tests are still failing after retries. 😞');
    }
  } catch (error) {
    console.error('\n💥 CI Integration Check failed:', error.message);
  } finally {
    await runner.cleanup();
  }
  
  process.exit(success ? 0 : 1);
}

// Export for potential use as module
module.exports = TestRunner;

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}