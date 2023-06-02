const { execSync } = require('node:child_process');
const packageJson = require('../package.json');

// "[ '1.0.0', '1.0.2', '1.0.3', '1.0.4', '1.1.0', '1.2.0' ]"
const publishedVersionsStr = execSync(`npm view ${packageJson.name} versions`)
  .toString('utf8')
  .trim();

const needPublish = publishedVersionsStr.includes(`'${packageJson.version}'`) === false;

console.log(needPublish);