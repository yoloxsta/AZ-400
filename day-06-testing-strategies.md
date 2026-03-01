# Day 6: Azure Test Plans & Testing Strategies

## What is Azure Test Plans?

Azure Test Plans provides tools for manual and exploratory testing, test case management, and tracking test results.

## Why Testing Matters?

- Ensure code quality
- Catch bugs before production
- Document expected behavior
- Enable confident refactoring
- Reduce technical debt

## Testing Pyramid

```
       /\
      /  \  E2E Tests (Few)
     /____\
    /      \  Integration Tests (Some)
   /________\
  /          \  Unit Tests (Many)
 /____________\
```

## Lab 6: Implement Testing Strategy

### Part 1: Unit Testing

1. **Create New Branch**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/add-comprehensive-tests
   ```

2. **Create `calculator.js`**
   ```javascript
   class Calculator {
     add(a, b) {
       return a + b;
     }
     
     subtract(a, b) {
       return a - b;
     }
     
     multiply(a, b) {
       return a * b;
     }
     
     divide(a, b) {
       if (b === 0) throw new Error('Division by zero');
       return a / b;
     }
   }
   
   module.exports = Calculator;
   ```

3. **Create `calculator.test.js`**
   ```javascript
   const Calculator = require('./calculator');
   
   describe('Calculator', () => {
     let calc;
     
     beforeEach(() => {
       calc = new Calculator();
     });
     
     describe('add', () => {
       test('should add two positive numbers', () => {
         expect(calc.add(2, 3)).toBe(5);
       });
       
       test('should add negative numbers', () => {
         expect(calc.add(-2, -3)).toBe(-5);
       });
     });
     
     describe('divide', () => {
       test('should divide numbers', () => {
         expect(calc.divide(10, 2)).toBe(5);
       });
       
       test('should throw error on division by zero', () => {
         expect(() => calc.divide(10, 0)).toThrow('Division by zero');
       });
     });
   });
   ```

4. **Update `package.json` for Coverage**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:coverage": "jest --coverage"
     },
     "jest": {
       "collectCoverageFrom": [
         "*.js",
         "!*.test.js"
       ],
       "coverageThreshold": {
         "global": {
           "branches": 80,
           "functions": 80,
           "lines": 80
         }
       }
     }
   }
   ```

### Part 2: Integration Testing

1. **Create `api.js`**
   ```javascript
   const Calculator = require('./calculator');
   
   class API {
     constructor() {
       this.calc = new Calculator();
     }
     
     processRequest(operation, a, b) {
       try {
         switch(operation) {
           case 'add': return { result: this.calc.add(a, b), status: 'success' };
           case 'subtract': return { result: this.calc.subtract(a, b), status: 'success' };
           case 'multiply': return { result: this.calc.multiply(a, b), status: 'success' };
           case 'divide': return { result: this.calc.divide(a, b), status: 'success' };
           default: return { error: 'Invalid operation', status: 'error' };
         }
       } catch (error) {
         return { error: error.message, status: 'error' };
       }
     }
   }
   
   module.exports = API;
   ```

2. **Create `api.test.js`**
   ```javascript
   const API = require('./api');
   
   describe('API Integration Tests', () => {
     let api;
     
     beforeEach(() => {
       api = new API();
     });
     
     test('should process add request', () => {
       const result = api.processRequest('add', 5, 3);
       expect(result.status).toBe('success');
       expect(result.result).toBe(8);
     });
     
     test('should handle division by zero', () => {
       const result = api.processRequest('divide', 10, 0);
       expect(result.status).toBe('error');
       expect(result.error).toBe('Division by zero');
     });
     
     test('should handle invalid operation', () => {
       const result = api.processRequest('invalid', 1, 2);
       expect(result.status).toBe('error');
     });
   });
   ```

### Part 3: Update Pipeline with Testing

1. **Update `azure-pipelines.yml`**
   ```yaml
   trigger:
     branches:
       include:
         - main
   
   pool:
     vmImage: 'ubuntu-latest'
   
   stages:
   - stage: Test
     displayName: 'Test Stage'
     jobs:
     - job: UnitTests
       displayName: 'Run Unit Tests'
       steps:
       - task: NodeTool@0
         inputs:
           versionSpec: '18.x'
         displayName: 'Install Node.js'
       
       - script: npm install
         displayName: 'Install dependencies'
       
       - script: npm run test:coverage
         displayName: 'Run tests with coverage'
       
       - task: PublishTestResults@2
         condition: succeededOrFailed()
         inputs:
           testResultsFormat: 'JUnit'
           testResultsFiles: '**/junit.xml'
           failTaskOnFailedTests: true
         displayName: 'Publish test results'
       
       - task: PublishCodeCoverageResults@1
         inputs:
           codeCoverageTool: 'Cobertura'
           summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
         displayName: 'Publish code coverage'
   ```

2. **Configure Jest for CI**
   Update `package.json`:
   ```json
   {
     "jest": {
       "testEnvironment": "node",
       "coverageReporters": ["text", "cobertura", "html"],
       "reporters": [
         "default",
         ["jest-junit", {
           "outputDirectory": ".",
           "outputName": "junit.xml"
         }]
       ]
     },
     "devDependencies": {
       "jest": "^29.0.0",
       "jest-junit": "^16.0.0"
     }
   }
   ```

### Part 4: Manual Test Cases (Azure Test Plans)

1. **Navigate to Test Plans**
   - Go to Test Plans in Azure DevOps
   - Click "New Test Plan"
   - Name: "Calculator Test Plan"
   - Click "Create"

2. **Create Test Suite**
   - Click "New Suite" → "Static suite"
   - Name: "Calculator Operations"

3. **Create Test Cases**
   - Click "New Test Case"
   - Title: "Verify Addition Operation"
   - Steps:
     1. Open calculator
     2. Enter 5 + 3
     3. Click calculate
   - Expected: Result shows 8
   - Save

   Create more test cases:
   - "Verify Division by Zero Error"
   - "Verify Negative Number Handling"

4. **Run Test**
   - Select test case
   - Click "Run for web application"
   - Mark steps as Pass/Fail
   - Add comments if needed
   - Save results

### Part 5: Exploratory Testing

1. **Create Exploratory Session**
   - Go to Test Plans → Runs
   - Click "New" → "Exploratory session"
   - Select work item to explore
   - Click "Start session"

2. **Explore Application**
   - Test different scenarios
   - Create bugs on the fly
   - Take screenshots
   - Add notes

3. **End Session**
   - Click "End session"
   - Review findings

### Verification
- [ ] Unit tests created and passing
- [ ] Integration tests implemented
- [ ] Code coverage configured
- [ ] Pipeline runs tests
- [ ] Test results published
- [ ] Manual test cases created

## Key Concepts

- **Unit Test**: Tests single function/class
- **Integration Test**: Tests multiple components together
- **E2E Test**: Tests entire application flow
- **Code Coverage**: Percentage of code tested
- **Test Case**: Manual test with steps
- **Exploratory Testing**: Unscripted testing

## Testing Best Practices

- Write tests before fixing bugs
- Keep tests fast and isolated
- Use descriptive test names
- Aim for 80%+ code coverage
- Mock external dependencies
- Test edge cases and errors

## Jest Commands

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
npm test calculator.test   # Specific file
```

## Next Steps
Tomorrow we'll explore Azure Artifacts for package management.
