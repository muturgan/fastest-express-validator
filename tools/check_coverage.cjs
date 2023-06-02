const path = require('node:path');

const MIN_COVERAGE_PERCENT = Number(process.env.MIN_COVERAGE_PERCENT) || 80;
const COVERAGE_INFO_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

const coverageInfo = require(COVERAGE_INFO_PATH);

if (
        coverageInfo.total.statements.pct < MIN_COVERAGE_PERCENT
    ||  coverageInfo.total.functions.pct  < MIN_COVERAGE_PERCENT
    ||  coverageInfo.total.branches.pct   < MIN_COVERAGE_PERCENT
) {
    throw new Error('code coverage is low');
}

console.info('code coverage is enough');