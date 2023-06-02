const fs = require('node:fs');
const path = require('node:path');

const DECLARATION_PATH = path.join(process.cwd(), 'dist', 'index.d.ts');

let fileContent = fs.readFileSync(DECLARATION_PATH).toString();

const reference = `/// <reference types="node" />
/// <reference types="express" />
`;

fileContent = reference + fileContent;

fs.writeFileSync(DECLARATION_PATH, fileContent, {flag: 'w'});
