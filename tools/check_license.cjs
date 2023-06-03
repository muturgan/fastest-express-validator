const fs = require('node:fs');
const { EOL } = require('node:os');
const path = require('node:path');

const LICENSE_PATH = path.join(process.cwd(), 'LICENSE');

const licenceContent = fs.readFileSync(LICENSE_PATH).toString();

const lines = licenceContent.split(EOL);

const copyrightLine = lines.find((l) => l.includes('Copyright (c)'));

const currentYear = new Date().getUTCFullYear().toString();

if (!copyrightLine.includes(currentYear)) {
    throw new Error('update your licence first');
}
