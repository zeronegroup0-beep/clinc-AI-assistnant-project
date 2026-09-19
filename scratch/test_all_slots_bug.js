const { processChatMessage } = require('../services/receptionistAgent');

const text = "كنت حابب اشوف كل مواعيد يوم الاثنين";

// Let's test on sessionData with Dr. Ahmed already active:
const sessionData = {
    doctor_id: 'dr_ahmed',
    specialty_id: 'dentistry',
    bookingDraft: {
        doctor: 'د. أحمد شريف',
        specialty: 'طب وجراحة الأسنان',
        doctor_id: 'dr_ahmed'
    }
};

processChatMessage({ message: text, sessionData }).then(res => {
    console.log("Bot reply:\n", res.reply);
    console.log("Reasoning:\n", res.reasoningSteps);
    console.log("Suggested slots:", res.suggestedSlots);
}).catch(console.error);
