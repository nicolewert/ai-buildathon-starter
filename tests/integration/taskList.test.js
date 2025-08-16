const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const TIMEOUT = 10000;

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class TaskListIntegrationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 Starting TaskList Integration Tests...');
    
    this.browser = await chromium.launch({
      headless: true
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(testName, status = 'failure') {
    const timestamp = Date.now();
    const filename = `${testName}-${status}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    
    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async waitForServer() {
    console.log('⏳ Waiting for development server...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await this.page.goto(BASE_URL, { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        if (response && response.status() === 200) {
          console.log('✅ Development server is ready');
          return true;
        }
      } catch (error) {
        console.log(`⏳ Server not ready, attempt ${i + 1}/30...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('❌ Development server failed to start within 30 seconds');
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      await testFunction();
      console.log(`✅ PASS: ${testName}`);
      this.testResults.push({ name: testName, status: 'PASS' });
      return true;
    } catch (error) {
      console.log(`❌ FAIL: ${testName}`);
      console.log(`   Error: ${error.message}`);
      
      await this.takeScreenshot(testName.replace(/\s+/g, '-').toLowerCase());
      this.testResults.push({ 
        name: testName, 
        status: 'FAIL', 
        error: error.message 
      });
      return false;
    }
  }

  async testHomepageLoads() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Check if homepage title is present
    const titleElement = await this.page.waitForSelector('h1', { timeout: TIMEOUT });
    const titleText = await titleElement.textContent();
    
    if (!titleText.includes('Ready to Build')) {
      throw new Error(`Expected homepage title to contain "Ready to Build", got: ${titleText}`);
    }
    
    // Check if TaskList component is present
    const taskListElement = await this.page.waitForSelector('.max-w-2xl', { timeout: TIMEOUT });
    if (!taskListElement) {
      throw new Error('TaskList component not found on homepage');
    }
  }

  async testTaskCreation() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait for task input to be present
    const taskInput = await this.page.waitForSelector('input[placeholder*="Add a new task"]', { timeout: TIMEOUT });
    const submitButton = await this.page.waitForSelector('button[type="submit"]', { timeout: TIMEOUT });
    
    // Add a new task
    const testTaskText = `Test Task ${Date.now()}`;
    await taskInput.fill(testTaskText);
    await submitButton.click();
    
    // Wait for the task to appear in the list
    await this.page.waitForFunction(
      (taskText) => {
        const taskElements = document.querySelectorAll('.flex.items-center.gap-2.p-3');
        return Array.from(taskElements).some(el => el.textContent.includes(taskText));
      },
      testTaskText,
      { timeout: TIMEOUT }
    );
    
    // Verify the input field was cleared
    const inputValue = await taskInput.inputValue();
    if (inputValue !== '') {
      throw new Error('Task input should be cleared after submission');
    }
  }

  async testTaskToggle() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Create a task first
    const taskInput = await this.page.waitForSelector('input[placeholder*="Add a new task"]', { timeout: TIMEOUT });
    const submitButton = await this.page.waitForSelector('button[type="submit"]', { timeout: TIMEOUT });
    
    const testTaskText = `Toggle Test ${Date.now()}`;
    await taskInput.fill(testTaskText);
    await submitButton.click();
    
    // Wait for task to appear and find its toggle button
    await this.page.waitForFunction(
      (taskText) => {
        const taskElements = document.querySelectorAll('.flex.items-center.gap-2.p-3');
        return Array.from(taskElements).some(el => el.textContent.includes(taskText));
      },
      testTaskText,
      { timeout: TIMEOUT }
    );
    
    // Find and click the check button for our task
    const taskElementLocator = this.page.locator('.flex.items-center.gap-2.p-3').filter({ hasText: testTaskText });
    const checkButton = taskElementLocator.locator('button').first();
    
    await checkButton.click();
    
    // Verify the task shows as completed (has line-through styling)
    await this.page.waitForFunction(
      (taskText) => {
        const taskElements = document.querySelectorAll('.flex.items-center.gap-2.p-3');
        const taskElement = Array.from(taskElements).find(el => el.textContent.includes(taskText));
        if (!taskElement) return false;
        
        const taskSpan = taskElement.querySelector('span.flex-1');
        return taskSpan && taskSpan.classList.contains('line-through');
      },
      testTaskText,
      { timeout: TIMEOUT }
    );
  }

  async testTaskDeletion() {
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Create a task first
    const taskInput = await this.page.waitForSelector('input[placeholder*="Add a new task"]', { timeout: TIMEOUT });
    const submitButton = await this.page.waitForSelector('button[type="submit"]', { timeout: TIMEOUT });
    
    const testTaskText = `Delete Test ${Date.now()}`;
    await taskInput.fill(testTaskText);
    await submitButton.click();
    
    // Wait for task to appear
    await this.page.waitForFunction(
      (taskText) => {
        const taskElements = document.querySelectorAll('.flex.items-center.gap-2.p-3');
        return Array.from(taskElements).some(el => el.textContent.includes(taskText));
      },
      testTaskText,
      { timeout: TIMEOUT }
    );
    
    // Find and click the delete button for our task
    const taskElementLocator = this.page.locator('.flex.items-center.gap-2.p-3').filter({ hasText: testTaskText });
    const deleteButton = taskElementLocator.locator('button').nth(1); // Second button should be delete
    
    await deleteButton.click();
    
    // Verify the task is removed from the list
    await this.page.waitForFunction(
      (taskText) => {
        const taskElements = document.querySelectorAll('.flex.items-center.gap-2.p-3');
        return !Array.from(taskElements).some(el => el.textContent.includes(taskText));
      },
      testTaskText,
      { timeout: TIMEOUT }
    );
  }

  async runAllTests() {
    await this.setup();
    
    try {
      await this.waitForServer();
      
      // Run all tests
      await this.runTest('Homepage Loads', () => this.testHomepageLoads());
      await this.runTest('Task Creation', () => this.testTaskCreation());
      await this.runTest('Task Toggle', () => this.testTaskToggle());
      await this.runTest('Task Deletion', () => this.testTaskDeletion());
      
      // Print results
      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      
      const passed = this.testResults.filter(r => r.status === 'PASS').length;
      const failed = this.testResults.filter(r => r.status === 'FAIL').length;
      
      this.testResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
        if (result.error) {
          console.log(`   ${result.error}`);
        }
      });
      
      console.log(`\nTotal: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
      
      if (failed > 0) {
        console.log(`\n📸 Failure screenshots saved in: ${SCREENSHOT_DIR}`);
        process.exit(1);
      } else {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('💥 Test suite failed to run:', error.message);
      await this.takeScreenshot('test-suite-failure');
      process.exit(1);
    } finally {
      await this.teardown();
    }
  }
}

// Export for potential use as module
module.exports = TaskListIntegrationTest;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new TaskListIntegrationTest();
  testSuite.runAllTests().catch(console.error);
}