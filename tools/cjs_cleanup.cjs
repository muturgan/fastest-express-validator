const { EOL } = require('os');
const fs = require('fs');
const path = require('path');

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

fs.writeFileSync(TARGET_PATH, fileContent, {flag: 'w'});
