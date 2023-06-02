const fs = require('node:fs');
const path = require('node:path');

const TARGET_PATH = path.join(process.cwd(), 'dist', 'index.cjs');

let fileContent = fs.readFileSync(TARGET_PATH).toString();

fileContent = fileContent.replace(`
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};`,
    ''
);
fileContent = fileContent.replace(
    'const fastest_validator_1 = __importDefault(require("fastest-validator"));',
    'const Validator = require("fastest-validator");'
);
fileContent = fileContent.replace(
    'fastest_validator_1.default',
    'Validator'
);
fileContent = fileContent.replace(
    '(0, exports.RequestValidator)',
    'RequestValidator'
);

fs.writeFileSync(TARGET_PATH, fileContent, {flag: 'w'});

const TEST_HELPER_PATH = path.join(process.cwd(), 'dist', 'tests', 'helpers', 'test_app.js');

let helperContent = fs.readFileSync(TEST_HELPER_PATH).toString();

helperContent = helperContent.replace(
    'const index_1 = require("../../index");',
    'const index_1 = require("../../index.cjs");'
);

fs.writeFileSync(TEST_HELPER_PATH, helperContent, {flag: 'w'});
