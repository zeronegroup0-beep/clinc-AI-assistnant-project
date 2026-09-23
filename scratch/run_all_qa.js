const { runAllTests } = require('../services/qaRunner');

async function main() {
    console.log('Running all tests...');
    const results = await runAllTests();
    console.log('--- QA SUITE SUMMARY ---');
    console.log('Total Tests:', results.summary.total);
    console.log('Passed:', results.summary.passed);
    console.log('Failed:', results.summary.failed);
    console.log('Pass Rate:', results.summary.passRate);
    console.log('Duration (ms):', results.summary.durationMs);

    if (results.summary.failed > 0) {
        console.log('\nFAILED TESTS:');
        results.results.filter(r => !r.passed).forEach(r => {
            console.log(`- [${r.id}] ${r.title}:`);
            r.failures.forEach(f => console.log(`   ${f}`));
        });
    }
    process.exit(results.summary.failed === 0 ? 0 : 1);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
