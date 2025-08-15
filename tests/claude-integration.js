#!/usr/bin/env node

/**
 * Claude Code Integration Script
 * 
 * This script provides a streamlined interface for Claude to run integration
 * tests continuously until they pass. Designed for rapid hackathon development
 * where you want Claude to validate your changes automatically.
 */

const { spawn } = require('child_process');
const path = require('path');

class ClaudeIntegration {
  constructor() {
    this.isRunning = false;
    this.currentProcess = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
      info: '🤖',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      running: '🔄'
    };
    
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      this.currentProcess = proc;

      proc.on('close', (code) => {
        this.currentProcess = null;
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      proc.on('error', (error) => {
        this.currentProcess = null;
        reject(error);
      });
    });
  }

  async installDependencies() {
    this.log('Checking dependencies...');
    
    try {
      await this.runCommand('pnpm', ['install']);
      this.log('Dependencies are up to date', 'success');
    } catch (error) {
      this.log('Failed to install dependencies', 'error');
      throw error;
    }
  }

  async runQuickCheck() {
    this.log('Running quick integration check...');
    
    try {
      await this.runCommand('pnpm', ['ci-check']);
      this.log('Quick check passed!', 'success');
      return true;
    } catch (error) {
      this.log('Quick check failed', 'error');
      return false;
    }
  }

  async runContinuousIntegration() {
    this.log('Starting continuous integration mode...', 'running');
    this.log('This will run tests repeatedly until they all pass');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      attempts++;
      this.log(`Integration attempt ${attempts}/${maxAttempts}`, 'running');
      
      try {
        const success = await this.runQuickCheck();
        
        if (success) {
          this.log(`All tests passed after ${attempts} attempts!`, 'success');
          this.log('Your integration is working correctly! 🚀', 'success');
          return true;
        }
        
        if (attempts < maxAttempts) {
          this.log(`Attempt ${attempts} failed, retrying in 10 seconds...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      } catch (error) {
        this.log(`Attempt ${attempts} encountered an error: ${error.message}`, 'error');
        
        if (attempts < maxAttempts) {
          this.log('Waiting 15 seconds before retry...', 'warning');
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }
    }
    
    this.log(`All ${maxAttempts} attempts failed`, 'error');
    this.log('Please check your code and try again', 'warning');
    return false;
  }

  async runSingleTest() {
    this.log('Running single integration test...');
    
    try {
      await this.runCommand('pnpm', ['test-integration']);
      this.log('Integration test passed!', 'success');
      return true;
    } catch (error) {
      this.log('Integration test failed', 'error');
      return false;
    }
  }

  async startDevServer() {
    this.log('Starting development server in background...', 'running');
    
    try {
      // Start the background server (non-blocking)
      const proc = spawn('pnpm', ['dev-bg'], {
        stdio: 'pipe',
        detached: true,
        shell: true
      });

      proc.unref(); // Allow the parent process to exit

      this.log('Development server started in background', 'success');
      this.log('You can now run integration tests with: pnpm test-integration', 'info');
      this.log('Or run continuous integration with: pnpm ci-check', 'info');
      
      return true;
    } catch (error) {
      this.log('Failed to start development server', 'error');
      return false;
    }
  }

  displayUsage() {
    console.log(`
🤖 Claude Code Integration Tool
===============================

Usage: node tests/claude-integration.js [command]

Commands:
  check          Run a single integration check
  continuous     Run continuous integration (retry until pass)
  test           Run integration tests only (requires running server)
  dev            Start development server in background
  install        Install/update dependencies
  help           Show this help message

Examples:
  # Quick single check (recommended for Claude)
  node tests/claude-integration.js check

  # Continuous integration (keeps trying until success)
  node tests/claude-integration.js continuous

  # Start background dev server first, then test
  node tests/claude-integration.js dev
  node tests/claude-integration.js test

Package.json shortcuts:
  pnpm ci-check           # Same as: node tests/claude-integration.js check
  pnpm test-integration   # Same as: node tests/claude-integration.js test
  pnpm dev-bg            # Start all services in background
`);
  }

  async cleanup() {
    if (this.currentProcess) {
      this.log('Cleaning up running processes...', 'warning');
      this.currentProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (this.currentProcess && !this.currentProcess.killed) {
          this.currentProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

async function main() {
  const integration = new ClaudeIntegration();
  const command = process.argv[2] || 'help';
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\\n⚡ Received SIGINT, cleaning up...');
    await integration.cleanup();
    process.exit(1);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\\n⚡ Received SIGTERM, cleaning up...');
    await integration.cleanup();
    process.exit(1);
  });

  try {
    integration.log('Claude Code Integration Tool Started', 'info');
    
    switch (command.toLowerCase()) {
      case 'check':
        await integration.installDependencies();
        const success = await integration.runQuickCheck();
        process.exit(success ? 0 : 1);
        break;
        
      case 'continuous':
      case 'ci':
        await integration.installDependencies();
        const ciSuccess = await integration.runContinuousIntegration();
        process.exit(ciSuccess ? 0 : 1);
        break;
        
      case 'test':
        const testSuccess = await integration.runSingleTest();
        process.exit(testSuccess ? 0 : 1);
        break;
        
      case 'dev':
        await integration.startDevServer();
        break;
        
      case 'install':
        await integration.installDependencies();
        break;
        
      case 'help':
      case '--help':
      case '-h':
      default:
        integration.displayUsage();
        break;
    }
  } catch (error) {
    integration.log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Export for potential use as module
module.exports = ClaudeIntegration;

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}