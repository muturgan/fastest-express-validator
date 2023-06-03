const fs = require('node:fs');
const { EOL } = require('node:os');
const path = require('node:path');

const MIN_COVERAGE_PERCENT = Number(process.env.MIN_COVERAGE_PERCENT) || 80;
const COVERAGE_INFO_PATH = path.join(process.cwd(), 'coverage.txt');

const coverageInfo = fs.readFileSync(COVERAGE_INFO_PATH).toString();

const lines = coverageInfo.split(EOL);

const libCoverageInfo = lines.find((l) => l.includes('index.cjs'));
const coverageValues = libCoverageInfo.split('|').map((v) => Number(v.trim()));
const [, linesCoverage, branchesCoverage, funcsCoverage] = coverageValues;

if (
        linesCoverage < MIN_COVERAGE_PERCENT
    ||  branchesCoverage  < MIN_COVERAGE_PERCENT
    ||  funcsCoverage   < MIN_COVERAGE_PERCENT
) {
    throw new Error('code coverage is too low');
}

console.info(branchesCoverage + '%');