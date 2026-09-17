const { processChatMessage } = require('../services/receptionistAgent');

async function testDoctorSwitch() {
    console.log('Testing Doctor Switch Mid-Conversation...\n');

    // Turn 1
    const res1 = await processChatMessage({
        message: 'اسمي هاني رمزي وعايز كشف أسنان مع د. أحمد شريف يوم الإثنين',
        sessionId: 'switch_test_1',
        sessionData: {}
    });
    console.log('--- Turn 1 ---');
    console.log('Bot Reply:', res1.reply);
    console.log('State Doctor:', res1.state.bookingDraft?.doctor);
    console.log('State Specialty:', res1.state.bookingDraft?.specialty);
    console.log('State Category:', res1.state.bookingDraft?.category);
    console.log('State ServiceName:', res1.state.bookingDraft?.serviceName);
    console.log('State IsCatalogMatch:', res1.state.bookingDraft?.isServiceCatalogMatch);
    console.log('State Doctor ID:', res1.state.doctor_id, 'Draft Doctor ID:', res1.state.bookingDraft?.doctor_id);
    console.log('State Specialty ID:', res1.state.specialty_id, 'Draft Specialty ID:', res1.state.bookingDraft?.specialty_id);

    // Turn 2: Switch to Dr. Hossam
    const res2 = await processChatMessage({
        message: 'لا معلش غيرت رأيي، عايز كشف باطنة مع د. حسام فتحي',
        sessionId: 'switch_test_1',
        sessionData: res1.state
    });
    console.log('\n--- Turn 2 (Switch to Dr. Hossam) ---');
    console.log('Bot Reply:', res2.reply);
    console.log('State Doctor:', res2.state.bookingDraft?.doctor);
    console.log('State Specialty:', res2.state.bookingDraft?.specialty);
    console.log('State Category:', res2.state.bookingDraft?.category);
    console.log('State ServiceName:', res2.state.bookingDraft?.serviceName);
    console.log('State IsCatalogMatch:', res2.state.bookingDraft?.isServiceCatalogMatch);
    console.log('State Doctor ID:', res2.state.doctor_id, 'Draft Doctor ID:', res2.state.bookingDraft?.doctor_id);
    console.log('State Specialty ID:', res2.state.specialty_id, 'Draft Specialty ID:', res2.state.bookingDraft?.specialty_id);

    // Check assertions:
    const containsHossam = res2.reply.includes('حسام فتحي');
    const containsBatna = res2.reply.includes('الباطنة');
    const containsAsnan = res2.reply.includes('الأسنان') || res2.reply.includes('اسنان');
    console.log('\nContains Hossam:', containsHossam);
    console.log('Contains Batna:', containsBatna);
    console.log('Contains Dental (Asnan - MUST BE FALSE):', containsAsnan);
}

testDoctorSwitch().catch(console.error);
