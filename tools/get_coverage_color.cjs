const path = require('path');

const COVERAGE_INFO_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

const coverageInfo = require(COVERAGE_INFO_PATH);
const coverage = coverageInfo.total.branches.pct;

let coverageColor = 'green';
if (coverage <= 80) {
    coverageColor = 'orange';
}
if (coverage <= 60) {
    coverageColor = 'red';
}

coverageColor;