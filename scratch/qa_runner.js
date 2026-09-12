const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const qaRunner = require('../services/qaRunner');

async function main() {
    console.log('\n================================================================');
    console.log('🤖 Nora AI Agent Automated QA Test Bench (22 Tricky Cases)');
    console.log('================================================================\n');

    const startTime = Date.now();
    const { summary, results } = await qaRunner.runAllTests();

    results.forEach((r, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const icon = r.passed ? '✅' : '❌';
        const status = r.passed ? 'PASSED' : 'FAILED';
        console.log(`[${num}] ${icon} ${status} (${r.durationMs}ms) • ${r.title}`);
        console.log(`     👤 Persona: ${r.persona}`);

        r.turns.forEach((t, tIdx) => {
            console.log(`     [Turn ${tIdx + 1}] User: "${t.userMessage}"`);
            const snippet = t.botReply.length > 80 ? t.botReply.substring(0, 80) + '...' : t.botReply;
            console.log(`            Nora: "${snippet.replace(/\n/g, ' ')}"`);
            if (t.suggestedSlots && t.suggestedSlots.length > 0) {
                console.log(`            Slots: [${t.suggestedSlots.join(', ')}]`);
            }
        });

        if (!r.passed && r.failures && r.failures.length > 0) {
            console.log('     ⚠️  Failures:');
            r.failures.forEach(f => console.log(`        - ${f}`));
        }
        console.log('');
    });

    console.log('================================================================');
    console.log('📊 QA EXECUTION SUMMARY:');
    console.log(`   • Total Cases:       ${summary.total}`);
    console.log(`   • Passed:            ${summary.passed} ✅`);
    console.log(`   • Failed:            ${summary.failed} ${summary.failed > 0 ? '❌' : ''}`);
    console.log(`   • Pass Rate:         ${summary.passRate}`);
    console.log(`   • Total Time:        ${summary.durationMs}ms`);
    console.log(`   • Avg Time per Test: ${summary.averageDurationMs}ms`);
    console.log('================================================================\n');

    if (summary.failed > 0) {
        process.exit(1);
    } else {
        console.log('🎉 ALL 22 QA TEST CASES PASSED WITH 100% SUCCESS RATE!\n');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal QA Runner Error:', err);
    process.exit(1);
});
