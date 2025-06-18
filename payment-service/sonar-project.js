const sonarqubeScanner = require('sonarqube-scanner');

sonarqubeScanner(
  {
    serverUrl: 'http://localhost:9000', // Your SonarQube server URL
    options: {
      'sonar.projectKey': 'nestjs-my-app', // Use the project key you created in SonarQube
      'sonar.projectName': 'My NestJS Application', // Optional: Display name
      'sonar.sources': 'src', // Where your source code is located
      'sonar.tests': 'src', // Where your test files are located
      'sonar.inclusions': 'src/**/*.ts', // Include all TypeScript files
      'sonar.test.inclusions': 'src/**/*.spec.ts,src/**/*.test.ts', // Include test files
      'sonar.typescript.lcov.reportPaths': 'coverage/lcov.info', // Path to your LCOV coverage report
      'sonar.login': 'YOUR_SONARQUBE_TOKEN', // The token you generated
      // You might need to adjust exclusions depending on your project structure
      'sonar.exclusions': 'node_modules/**,dist/**,src/**/*.spec.ts,src/**/*.test.ts',
    },
  },
  () => {
    // Callback function after scan completes
    console.log('SonarQube scan finished.');
  }
);