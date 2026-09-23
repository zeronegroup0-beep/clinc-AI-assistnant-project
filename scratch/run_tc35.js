const { runTestCase } = require('../services/qaRunner');
const suite = require('../config/qa_suite');

async function main() {
    const tc = suite.find(t => t.id === 'tc_35_strict_11_digit_phone_validation');
    const res = await runTestCase(tc);
    console.log('PASSED:', res.passed);
    console.log('FAILURES:', res.failures);
    res.turns.forEach((t, i) => {
        console.log(`\n--- TURN ${i + 1} ---`);
        console.log('User:', t.userMessage);
        console.log('Bot:', t.botReply);
        console.log('State:', t.nextState);
        console.log('Passed:', t.passed, t.turnFailures);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
