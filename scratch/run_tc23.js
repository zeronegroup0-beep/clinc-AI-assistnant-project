const { runTestCase } = require('../services/qaRunner');
const suite = require('../config/qa_suite');

async function main() {
    const tc = suite.find(t => t.id === 'tc_23_female_gender_alignment');
    const res = await runTestCase(tc);
    console.log('PASSED:', res.passed);
    console.log('FAILURES:', res.failures);
    if (res.turns && res.turns[0]) {
        console.log('BOT REPLY:', res.turns[0].botReply);
        console.log('REASONING:', res.turns[0].reasoningSteps);
        console.log('STATE:', res.turns[0].nextState);
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
