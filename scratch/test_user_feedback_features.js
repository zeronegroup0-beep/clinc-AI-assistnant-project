const { processChatMessage } = require('../services/receptionistAgent');

async function run() {
    console.log('================================================================');
    console.log('🧪 TEST 1: Number Selection ("2" -> Dr. Sara Mahmoud)');
    console.log('================================================================');
    const s1 = {};
    const r1 = await processChatMessage({ message: 'عايز أحجز ميعاد', sessionState: s1 });
    console.log('Turn 1 (Generic prompt) ->\n', r1.reply);
    
    const r2 = await processChatMessage({ message: '2', sessionState: s1 });
    console.log('\nTurn 2 (User enters "2") ->\n', r2.reply);
    const hasSara = r2.reply.includes('د. سارة محمود') && r2.reply.includes('الأحد، الثلاثاء، والخميس');
    console.log('✅ Correctly routed to Dr. Sara:', hasSara);

    console.log('\n================================================================');
    console.log('🧪 TEST 2: Multi-Doctor Inquiry ("مواعيد د احمد و د سارة ايه ؟")');
    console.log('================================================================');
    const r3 = await processChatMessage({ message: 'مواعيد د احمد و د سارة ايه ؟', sessionState: {} });
    console.log('Response ->\n', r3.reply);
    const hasBoth = r3.reply.includes('د. أحمد شريف') && r3.reply.includes('د. سارة محمود') && r3.reply.includes('السبت، الإثنين، والأربعاء') && r3.reply.includes('الأحد، الثلاثاء، والخميس');
    const ahmedFirst = r3.reply.indexOf('د. أحمد شريف') < r3.reply.indexOf('د. سارة محمود');
    console.log('✅ Has both doctors:', hasBoth);
    console.log('✅ Preserved mention order (Ahmed first):', ahmedFirst);

    console.log('\n================================================================');
    console.log('🧪 TEST 3: Multi-Doctor Inquiry ("مواعيد دكتورة سارة ودكتور حسام")');
    console.log('================================================================');
    const r4 = await processChatMessage({ message: 'مواعيد دكتورة سارة ودكتور حسام', sessionState: {} });
    console.log('Response ->\n', r4.reply);
    const hasSaraHossam = r4.reply.includes('د. سارة محمود') && r4.reply.includes('د. حسام فتحي');
    const saraFirst = r4.reply.indexOf('د. سارة محمود') < r4.reply.indexOf('د. حسام فتحي');
    console.log('✅ Has Sara and Hossam:', hasSaraHossam);
    console.log('✅ Preserved mention order (Sara first):', saraFirst);

    console.log('\n================================================================');
    console.log('🧪 TEST 4: Direct Number Selections (1, 3, 4)');
    console.log('================================================================');
    const res1 = await processChatMessage({ message: '1', sessionState: {} });
    console.log('Input "1" ->', res1.reply.includes('د. أحمد شريف') ? '✅ Dr. Ahmed' : '❌ Failed');

    const res3 = await processChatMessage({ message: '3', sessionState: {} });
    console.log('Input "3" ->', res3.reply.includes('د. حسام فتحي') ? '✅ Dr. Hossam' : '❌ Failed');

    const res4 = await processChatMessage({ message: '4', sessionState: {} });
    console.log('Input "4" ->', res4.reply.includes('د. مريم نبيل') ? '✅ Dr. Mariam' : '❌ Failed');
}

run().catch(console.error);
