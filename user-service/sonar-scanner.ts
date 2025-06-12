import sonarqubeScanner from 'sonarqube-scanner';

interface SonarScannerOptions {
  serverUrl: string;
  token?: string;
  options: Record<string, string>;
}

function runSonarScanner({ serverUrl, token, options }: SonarScannerOptions) {
  sonarqubeScanner(
    {
      serverUrl,
      token,
      options,
    },
    () => {
      console.log('SonarQube scan finished');
      process.exit();
    },
  );
}

// Usage
runSonarScanner({
  serverUrl: 'http://localhost:9000', // replace with your SonarQube server URL
  token: process.env.SONAR_TOKEN, // optionally use env var for token
  options: {
    'sonar.projectKey': 'your-project-key',
    'sonar.projectName': 'your-project-name',
    'sonar.projectVersion': '1.0',
    'sonar.sources': 'src',
    'sonar.tests': 'test',
    'sonar.test.inclusions': '**/*.spec.ts,**/*.test.ts',
    'sonar.typescript.lcov.reportPaths': 'coverage/lcov.info',
    'sonar.sourceEncoding': 'UTF-8',
  },
});
