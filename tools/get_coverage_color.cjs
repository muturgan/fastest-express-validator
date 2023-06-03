const fs = require('node:fs');
const { EOL } = require('node:os');
const path = require('node:path');

const COVERAGE_INFO_PATH = path.join(process.cwd(), 'coverage.txt');

const coverageInfo = fs.readFileSync(COVERAGE_INFO_PATH).toString();

const lines = coverageInfo.split(EOL);

const libCoverageInfo = lines.find((l) => l.includes('index.cjs'));
const coverageValues = libCoverageInfo.split('|').map((v) => Number(v.trim()));
const [, , branchesCoverage] = coverageValues;

let coverageColor = 'green';
if (branchesCoverage <= 80) {
    coverageColor = 'orange';
}
if (branchesCoverage <= 60) {
    coverageColor = 'red';
}

console.log(coverageColor);
