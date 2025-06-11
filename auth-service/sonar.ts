import scanner from 'sonarqube-scanner';

scanner(
  {
    serverUrl: 'http://localhost:9000',
    token: 'your_token_here',
    options: {
      'sonar.projectKey': 'nest_mongo_app',
      'sonar.sources': 'src',
      'sonar.exclusions': '**/*.spec.ts',
      'sonar.tests': 'src',
      'sonar.test.inclusions': '**/*.spec.ts',
      'sonar.typescript.lcov.reportPaths': 'coverage/lcov.info',
    },
  },
  () => process.exit()
);
