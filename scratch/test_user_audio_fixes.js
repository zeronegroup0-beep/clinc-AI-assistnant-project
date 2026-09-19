const assert = require('assert');
const { processChatMessage } = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

async function runAllAudioFixTests() {
    console.log('================================================================');
    console.log('🧪 VERIFYING FIXES FOR 5 USER REPORTED AUDIO ISSUES');
    console.log('================================================================\n');

    let passedCount = 0;
    const fixedCurrentDate = new Date(2026, 8, 18, 10, 0, 0); // Friday Sept 18, 2026

    // -------------------------------------------------------------
    // TEST 1: Egyptian Arabic Day Recognition ("الحد" / "يوم الحد")
    // -------------------------------------------------------------
    console.log('--- TEST 1: Egyptian Colloquial Sunday ("الحد" / "يوم الحد") ---');
    {
        const r1 = await processChatMessage({
            message: 'عايز اكشف جلدية مع دكتورة سارة يوم الحد',
            sessionId: 'audio_t1_1',
            currentDate: fixedCurrentDate
        });
        assert(r1.reply.includes('د. سارة محمود'), 'Should recognize Dr. Sara');
        assert(r1.reply.includes('1:00') || r1.reply.includes('مواعيد'), 'Should present Sunday slots');
        assert.strictEqual(r1.state.bookingDraft.dateStr, '2026-09-20', 'Should resolve to Sunday 2026-09-20');
        console.log('  ✅ [PASS] "يوم الحد" correctly recognized as Sunday for Dr. Sara');

        const r2 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف يوم الحد',
            sessionId: 'audio_t1_2',
            currentDate: fixedCurrentDate
        });
        assert(r2.reply.includes('مش موجود في اليوم ده'), 'Should recognize Sunday is Dr. Ahmed day off');
        assert(r2.reply.includes('السبت') && r2.reply.includes('الإثنين'), 'Should offer Dr. Ahmed working days');
        console.log('  ✅ [PASS] "يوم الحد" correctly triggers day-off check for Dr. Ahmed');
        passedCount += 2;
    }

    // -------------------------------------------------------------
    // TEST 2: Unavailable Slot Inquiry ("مش متاح 4:30؟")
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Unavailable Slot Inquiry ("مش متاح 4:30؟") & Waitlist ---');
    {
        // Turn 1: Ask for Monday slots with Dr. Ahmed
        const r1 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف يوم الاتنين',
            sessionId: 'audio_t2',
            currentDate: fixedCurrentDate
        });
        assert(r1.reply.includes('المواعيد المتاحة'), 'Turn 1 presents Monday slots');

        // Turn 2: User asks "مش متاح 4:30؟"
        const r2 = await processChatMessage({
            message: 'مش متاح 4:30؟',
            sessionId: 'audio_t2',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert(r2.reply.includes('محجوز بالفعل'), 'Should recognize 4:30 is booked');
        assert(r2.reply.includes('قائمة الانتظار'), 'Should offer waitlist');
        assert(r2.reply.includes('بدلاً منه'), 'Should present alternative slots');
        assert.strictEqual(r2.state.awaitingWaitlist, true, 'State should await waitlist');
        assert.strictEqual(r2.state.waitlistSlot.time, '4:30 مساءً', 'Waitlist slot time is 4:30');
        console.log('  ✅ [PASS] "مش متاح 4:30؟" accurately checks booked slot, offers alternatives & waitlist');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 3: Ordinal & Numeric Slot Selection ("3", "1", "التالت", "4" out-of-range)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Ordinal & Numeric Slot Selection ---');
    {
        // Turn 1: Present Monday slots for Dr. Ahmed (5:30, 6:30, 7:30)
        const r1 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف يوم الاتنين',
            sessionId: 'audio_t3',
            currentDate: fixedCurrentDate
        });
        assert.deepStrictEqual(r1.state.presentedSlots, ['5:30 مساءً', '6:30 مساءً', '7:30 مساءً']);

        // Option "3" selects 7:30 PM
        const r2 = await processChatMessage({
            message: '3',
            sessionId: 'audio_t3',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert.strictEqual(r2.state.pendingBooking?.time, '7:30 مساءً', 'Number 3 must select 3rd slot (7:30 PM)');
        assert(r2.reply.includes('7:30 مساءً'), 'Reply must confirm 7:30 PM');
        console.log('  ✅ [PASS] Input "3" selects 3rd slot (7:30 مساءً) without defaulting to 3:00 PM');

        // Option "1" selects 5:30 PM
        const r2_1 = await processChatMessage({
            message: '1',
            sessionId: 'audio_t3_opt1',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert.strictEqual(r2_1.state.pendingBooking?.time, '5:30 مساءً', 'Number 1 must select 1st slot (5:30 PM)');
        console.log('  ✅ [PASS] Input "1" selects 1st slot (5:30 مساءً)');

        // Option "التالت" selects 7:30 PM
        const r2_telt = await processChatMessage({
            message: 'التالت',
            sessionId: 'audio_t3_telt',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert.strictEqual(r2_telt.state.pendingBooking?.time, '7:30 مساءً', '"التالت" must select 3rd slot');
        console.log('  ✅ [PASS] Input "التالت" selects 3rd slot (7:30 مساءً)');

        // Option "4" (out-of-range when 3 slots available)
        const r2_out = await processChatMessage({
            message: '4',
            sessionId: 'audio_t3_out',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert(r2_out.reply.includes('3 مواعيد فقط'), 'Should politely state only 3 slots are available');
        console.log('  ✅ [PASS] Input "4" politely handles out-of-range slot selection');
        passedCount += 4;
    }

    // -------------------------------------------------------------
    // TEST 4: Doctor Switching Without Repeating Welcome Greeting Mid-Conversation
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Doctor Switching Mid-Conversation ---');
    {
        // Start multi-doctor: Ahmed + Hossam
        const r1 = await processChatMessage({
            message: 'عايز احجز مع دكتور احمد شريف ودكتور حسام فتحي',
            sessionId: 'audio_t4',
            currentDate: fixedCurrentDate
        });
        const r2 = await processChatMessage({
            message: 'دكتور احمد',
            sessionId: 'audio_t4',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        // Turn 3: User picks Monday 5:30 for Dr. Ahmed -> Bot suggests Dr. Hossam consecutive slot
        const r3 = await processChatMessage({
            message: 'يوم الاتنين 5:30',
            sessionId: 'audio_t4',
            sessionData: r2.state,
            currentDate: fixedCurrentDate
        });
        assert(r3.reply.includes('د. حسام فتحي'), 'Prompts for Dr. Hossam consecutive slot');
        assert.strictEqual(r3.state.multiDoctorContext.step, 'AWAITING_SECOND_DOCTOR_SLOT');

        // Turn 4: User changes mind: "لا لا أنا كنت عايز دكتور تاني"
        const r4 = await processChatMessage({
            message: 'لا لا أنا كنت عايز دكتور تاني',
            sessionId: 'audio_t4',
            sessionData: r3.state,
            currentDate: fixedCurrentDate
        });
        assert(!r4.reply.includes('نورت عيادتنا'), 'Must NOT repeat initial welcome greeting "نورت عيادتنا"');
        assert(r4.reply.includes('تحب تكشف مع مين من استشاريينا'), 'Must ask which doctor/specialty they prefer');
        assert.strictEqual(r4.state.multiDoctorContext, undefined, 'Must clear multiDoctorContext');
        console.log('  ✅ [PASS] "لا لا أنا كنت عايز دكتور تاني" resets doctor cleanly without repeating greeting');
        passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 5: Trailing Digit In Day Name & Booking Confirmation Guard
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Day Trailing Digit & Booking Confirmation Guard ---');
    {
        const existingSession = {
            patientName: 'عماد',
            userName: 'عماد',
            patientPhone: '01012345678',
            gender: 'male'
        };

        // Turn 1: User enters "عايز كشف جلدية مع دكتورة سارة يوم الأحد 1"
        const r1 = await processChatMessage({
            message: 'عايز كشف جلدية مع دكتورة سارة يوم الأحد 1',
            sessionId: 'audio_t5',
            sessionData: existingSession,
            currentDate: fixedCurrentDate
        });
        // Must show slots, NOT auto-book 1:00 PM!
        assert(r1.reply.includes('مواعيد د. سارة محمود'), 'Must present available slots');
        assert.strictEqual(r1.state.pendingBooking, undefined, 'Must not create pending booking yet');
        console.log('  ✅ [PASS] "يوم الأحد 1" displays slots and does NOT auto-book');

        // Turn 2: User enters "1" to pick slot #1
        const r2 = await processChatMessage({
            message: '1',
            sessionId: 'audio_t5',
            sessionData: r1.state,
            currentDate: fixedCurrentDate
        });
        assert(r2.reply.includes('تحب نأكد حجز حضرتك بنفس البيانات المسجلة باسم أستاذ عماد'), 'Must ask for confirmation first');
        assert.strictEqual(r2.state.awaitingBookingConfirmation, true, 'Must set awaitingBookingConfirmation to true');
        assert.strictEqual(r2.state.pendingBooking?.time, '1:00 مساءً', 'Pending booking time is 1:00 PM');
        console.log('  ✅ [PASS] Picking slot with existing patient info requests explicit confirmation');

        // Turn 3a: Decline
        const r3_dec = await processChatMessage({
            message: 'لا عايز ميعاد تاني',
            sessionId: 'audio_t5_dec',
            sessionData: r2.state,
            currentDate: fixedCurrentDate
        });
        assert(r3_dec.reply.includes('نختار ميعاد تاني يناسب حضرتك'), 'Politely handles decline');
        assert.strictEqual(r3_dec.state.awaitingBookingConfirmation, undefined);
        assert.strictEqual(r3_dec.state.pendingBooking, undefined);
        console.log('  ✅ [PASS] Declining confirmation cancels pending booking gracefully');

        // Turn 3b: Confirm
        const r3_conf = await processChatMessage({
            message: 'تمام أكد الحجز',
            sessionId: 'audio_t5_conf',
            sessionData: r2.state,
            currentDate: fixedCurrentDate
        });
        assert(r3_conf.reply.includes('تم تأكيد حجز حضرتك يا أستاذ عماد بنجاح'), 'Booking finalized on confirmation');
        assert.strictEqual(r3_conf.state.awaitingBookingConfirmation, undefined);
        console.log('  ✅ [PASS] Affirmative confirmation finalizes booking successfully');
        passedCount += 4;
    }

    console.log('\n================================================================');
    console.log(`📊 RESULTS: ${passedCount} / ${passedCount} TESTS PASSED (100%)`);
    console.log('================================================================\n');
    console.log('🎉 ALL 5 USER REPORTED ISSUES VERIFIED FIXED SUCCESSFULLY!');
}

runAllAudioFixTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
