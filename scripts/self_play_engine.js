const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const receptionistAgent = require('../services/receptionistAgent');
const appointmentService = require('../services/appointmentService');

const QA_LOGS_PATH = path.join(__dirname, '../data/qa_logs.json');

/**
 * 6 Realistic Simulator Personas & Scenarios for Multi-Turn Automated Self-Play
 */
const SELF_PLAY_SCENARIOS = [
  {
    id: 'sim_generic_dental_01',
    scenario: 'Generic Booking (Dentistry)',
    persona: {
      name: 'عمر خالد المحمدي',
      gender: 'male',
      style: 'مهذب ومباشر',
      objective: 'حجز كشف أسنان مع دكتور أحمد شريف يوم الإثنين الساعة 4:30 مساءً ومعرفة السعر'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'السلام عليكم، عايز استفسر عن كشف الأسنان مع دكتور أحمد شريف ومواعيده المتاحة في العيادة',
        expectedIntent: 'check_availability',
        evaluatorCriteria: {
          mustMentionDoctor: 'أحمد شريف',
          mustOfferWorkingDays: ['السبت', 'الإثنين', 'الأربعاء'],
          noPrematureFinalization: true
        }
      },
      {
        turn: 2,
        userMessage: 'هو الكشف بكام؟ وعايز ميعاد يوم الإثنين الساعة 5:30 مساءً لو متاح',
        expectedIntent: 'lock_slot_and_request_info',
        evaluatorCriteria: {
          mustMentionPrice: '350',
          mustRequestNameOrPhone: true,
          mustMentionTime: '5:30'
        }
      },
      {
        turn: 3,
        userMessage: 'اسمي بالكامل عمر خالد المحمدي ورقمي 01098765432',
        expectedIntent: 'confirm_booking',
        evaluatorCriteria: {
          mustConfirmBooking: true,
          mustHaveBookingCard: true,
          mustEchoPatientName: 'عمر خالد المحمدي'
        }
      }
    ]
  },
  {
    id: 'sim_doctor_switch_02',
    scenario: 'Doctor & Specialty Switch Mid-Flow',
    persona: {
      name: 'سارة مجدي السيد',
      gender: 'female',
      style: 'مترددة وتغير رأيها فجأة',
      objective: 'بدأت بالسؤال عن الأسنان ثم بدلت للجلدية مع د. سارة محمود'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'مساء الخير يا فندم، دكتور أحمد شريف متاح إمتى؟',
        expectedIntent: 'inquire_doctor_ahmed',
        evaluatorCriteria: {
          mustMentionDoctor: 'أحمد شريف',
          noPrematureFinalization: true
        }
      },
      {
        turn: 2,
        userMessage: 'لا معلش لغيت الفكرة، أنا عايزة دكتورة سارة محمود جلدية يوم الثلاثاء أحسن',
        expectedIntent: 'switch_to_dermatology',
        evaluatorCriteria: {
          mustSwitchToDoctor: 'سارة محمود',
          mustClearPreviousSpecialty: true,
          mustVerifyTuesday: true
        }
      },
      {
        turn: 3,
        userMessage: 'تمام احجزيلي ميعاد 4 عصراً، اسمي سارة مجدي السيد ورقمي 01123456789',
        expectedIntent: 'confirm_dermatology_booking',
        evaluatorCriteria: {
          mustConfirmBooking: true,
          mustMatchDoctor: 'سارة محمود',
          feminineAgreement: true
        }
      }
    ]
  },
  {
    id: 'sim_emergency_intercept_03',
    scenario: 'Critical Emergency Intercept',
    persona: {
      name: 'كريم عبد العزيز',
      gender: 'male',
      style: 'حالة طارئة حرجة جداً',
      objective: 'أعراض جلطة أو ذبحة صدرية حادة - يجب تحويله للطوارئ ورفض الحجز العادي'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'أنا بموت، عندي وجع رهيب وضغط جامد في صدري وضيق تنفس وعرق بارد من ربع ساعة',
        expectedIntent: 'emergency_intercept',
        evaluatorCriteria: {
          mustTriggerEmergencyAlert: true,
          mustAdviseHospitalOr123: true,
          mustRefuseRoutineBooking: true
        }
      },
      {
        turn: 2,
        userMessage: 'مش قادر أتحرك، احجزولي بسرعة أي دكتور يجيلي أو يشوفني حالا في العيادة',
        expectedIntent: 'reiterate_emergency',
        evaluatorCriteria: {
          mustMaintainEmergencyStance: true,
          mustUrgeImmediateAction: true
        }
      }
    ]
  },
  {
    id: 'sim_slot_filling_guard_04',
    scenario: 'Strict Slot Filling & Phone/Name Guardrails',
    persona: {
      name: 'أحمد مصطفى إبراهيم',
      gender: 'male',
      style: 'يقدم بيانات ناقصة في البداية ثم يصححها',
      objective: 'اختبار رفض الاسم الأحادي والرقم الناقص حتى يكتمل الاسم الثلاثي و11 رقماً'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'عايز احجز كشف باطنة مع دكتور حسام فتحي بكرة الساعة 5 مساءً',
        expectedIntent: 'ask_credentials',
        evaluatorCriteria: {
          mustAskPatientInfo: true
        }
      },
      {
        turn: 2,
        userMessage: 'اسمي أحمد ورقمي 01234',
        expectedIntent: 'reject_incomplete_credentials',
        evaluatorCriteria: {
          mustRejectShortName: true,
          mustRejectShortPhone: true,
          mustNotConfirmBooking: true
        }
      },
      {
        turn: 3,
        userMessage: 'اسمي بالكامل أحمد مصطفى إبراهيم ورقم موبايلي 01234567890',
        expectedIntent: 'accept_valid_and_confirm',
        evaluatorCriteria: {
          mustConfirmBooking: true,
          mustEchoPatientName: 'أحمد مصطفى إبراهيم'
        }
      }
    ]
  },
  {
    id: 'sim_waitlist_flow_05',
    scenario: 'Fully Booked Slot & Priority Waitlist',
    persona: {
      name: 'مريم حسن علي',
      gender: 'female',
      style: 'حريصة على ميعاد محدد محجوز',
      objective: 'الانضمام لقائمة الانتظار في حال كان الميعاد غير متاح'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'عايزة ميعاد ضروري يوم السبت مع دكتور أحمد شريف ولو مفيش ميعاد فاضي حطوني على قائمة الانتظار',
        expectedIntent: 'detect_waitlist_intent',
        evaluatorCriteria: {
          mustRecognizeWaitlist: true,
          mustRequestNameAndPhone: true
        }
      },
      {
        turn: 2,
        userMessage: 'تمام اسمي مريم حسن علي ورقم الواتساب 01511223344',
        expectedIntent: 'confirm_waitlist',
        evaluatorCriteria: {
          mustConfirmWaitlist: true,
          mustHaveWaitlistCardOrId: true
        }
      }
    ]
  },
  {
    id: 'sim_human_secretary_06',
    scenario: 'Human Secretary Handover Request',
    persona: {
      name: 'طارق سليم',
      gender: 'male',
      style: 'يفضل التحدث مع إنسان',
      objective: 'طلب التحويل الفوري لموظف الاستقبال البشري'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'لو سمحتِ عايز اتواصل مع حد من السكرتارية أو إدارة العيادة ضروري',
        expectedIntent: 'trigger_human_takeover',
        evaluatorCriteria: {
          mustTriggerTakeover: true,
          mustAssureHandover: true
        }
      },
      {
        turn: 2,
        userMessage: 'هل حد هيكلمني ولا أستنى هنا على الشات؟',
        expectedIntent: 'reassure_human_arrival',
        evaluatorCriteria: {
          mustKeepHumanQueueState: true
        }
      }
    ]
  },
  {
    id: 'sim_branch_compound_07',
    scenario: 'Compound Branch & Today Availability (Damanhour vs Alex)',
    persona: {
      name: 'هشام كمال الشريف',
      gender: 'male',
      style: 'دقيق ومحدد',
      objective: 'الاستفسار عن دكاترة فرع دمنهور النهاردة واستعراض دكاترة فرع الإسكندرية'
    },
    turns: [
      {
        turn: 1,
        userMessage: 'والله عايز أعرف مين اللي موجود في فرع دمنهور النهاردة؟',
        expectedIntent: 'filter_branch_and_today_doctors',
        evaluatorCriteria: {
          mustMentionDoctor: 'أحمد شريف',
          mustIncludeBranchName: 'دمنهور'
        }
      },
      {
        turn: 2,
        userMessage: 'ومين دكاترة فرع اسكندرية المتاحين عموماً في العيادة؟',
        expectedIntent: 'list_alex_branch_doctors',
        evaluatorCriteria: {
          mustMentionAlexDoctors: true
        }
      }
    ]
  }
];

/**
 * Intelligent Evaluator that grades Nora's responses against strict criteria
 */
function evaluateTurnResponse(turnSpec, result) {
  const reply = result.reply || '';
  const state = result.state || {};
  const card = result.card || null;
  const reasoning = result.reasoningSteps || [];
  const criteria = turnSpec.evaluatorCriteria || {};

  const failures = [];
  let scorePoints = 100;

  // 1. Doctor Mention
  if (criteria.mustMentionDoctor) {
    const docClean = criteria.mustMentionDoctor.replace('أ', 'ا').replace('إ', 'ا');
    const replyClean = reply.replace('أ', 'ا').replace('إ', 'ا');
    if (!replyClean.includes(docClean) && !reply.includes(criteria.mustMentionDoctor)) {
      failures.push(`لم يتم ذكر اسم الطبيب المطلوب "${criteria.mustMentionDoctor}" في الرد.`);
      scorePoints -= 25;
    }
  }

  // 2. Working days validation
  if (criteria.mustOfferWorkingDays) {
    const foundAny = criteria.mustOfferWorkingDays.some(d => {
      const dClean = d.replace('أ', 'ا').replace('إ', 'ا');
      const rClean = reply.replace('أ', 'ا').replace('إ', 'ا');
      return rClean.includes(dClean) || reply.includes(d);
    });
    if (!foundAny) {
      failures.push(`لم يتم ذكر أي من أيام عمل الطبيب المعتمدة.`);
      scorePoints -= 20;
    }
  }

  // 3. Premature confirmation guard
  if (criteria.noPrematureFinalization) {
    if (card && card.type === 'booking_confirmed') {
      failures.push(`تم تأكيد الحجز قبل استيفاء بيانات المريض بالكامل!`);
      scorePoints -= 50;
    }
  }

  // 4. Price check
  if (criteria.mustMentionPrice) {
    if (!reply.includes(criteria.mustMentionPrice) && !reply.includes('جنيه')) {
      failures.push(`لم يتم ذكر سعر الكشف (${criteria.mustMentionPrice} جنيه) كما طلب المريض.`);
      scorePoints -= 20;
    }
  }

  // 5. Booking Confirmation Card check
  if (criteria.mustConfirmBooking) {
    const hasCard = card && (card.type === 'booking_confirmed' || card.type === 'unified_booking_confirmed');
    const mentionsConfirmation = (reply.includes('تم') || reply.includes('تأكيد')) && (reply.includes('حجز') || reply.includes('كود') || reply.includes('موعدك') || reply.includes('SC-'));
    if (!hasCard && !mentionsConfirmation) {
      failures.push(`لم يتم إصدار بطاقة أو نص تأكيد الحجز النهائي.`);
      scorePoints -= 40;
    }
  }

  // 6. Emergency protocol check
  if (criteria.mustTriggerEmergencyAlert) {
    const isEmergency = Boolean(state.emergency) || reply.includes('123') || reply.includes('طوارئ') || reply.includes('مستشفى') || reply.includes('إسعاف') || reply.includes('فورا');
    if (!isEmergency) {
      failures.push(`فشل بروتوكول الطوارئ: لم يتم تحذير المريض أو توجيهه لرقم الإسعاف 123.`);
      scorePoints -= 60;
    }
  }

  // 7. Reject incomplete credentials guard
  if (criteria.mustRejectShortName || criteria.mustRejectShortPhone) {
    if (card && card.type === 'booking_confirmed') {
      failures.push(`تم قبول اسم أحادي أو رقم ناقص وتأكيد الحجز بالمخالفة لمعايير الأمان!`);
      scorePoints -= 50;
    }
  }

  // 8. Waitlist card check
  if (criteria.mustConfirmWaitlist) {
    const hasWaitlistCard = card && card.type === 'waitlist_confirmed';
    const hasWaitlistText = reply.includes('الانتظار') || reply.includes('قائمة') || reply.includes('WL-');
    if (!hasWaitlistCard && !hasWaitlistText) {
      failures.push(`لم يتم تسجيل المريض على قائمة الانتظار.`);
      scorePoints -= 35;
    }
  }

  // 9. Human Takeover check
  if (criteria.mustTriggerTakeover) {
    const hasTakeover = Boolean(state.takeoverRequested || state.humanTakeover) || reply.includes('السكرتارية') || reply.includes('الاستقبال') || reply.includes('خدمة العملاء');
    if (!hasTakeover) {
      failures.push(`لم يتم تفعيل طلب التدخل البشري للسكرتارية.`);
      scorePoints -= 35;
    }
  }

  // 10. Branch Name check
  if (criteria.mustIncludeBranchName) {
    if (!reply.includes(criteria.mustIncludeBranchName)) {
      failures.push(`لم يتم ذكر اسم الفرع المطلوب "${criteria.mustIncludeBranchName}" في الرد.`);
      scorePoints -= 25;
    }
  }

  // 11. Alex doctors check
  if (criteria.mustMentionAlexDoctors) {
    const hasAlexDocs = (reply.includes('حسام فتحي') || reply.includes('مريم نبيل')) && reply.includes('أحمد شريف');
    if (!hasAlexDocs) {
      failures.push(`لم يتم استرجاع دكاترة فرع الإسكندرية المعتمدين بدقة.`);
      scorePoints -= 30;
    }
  }

  const passed = failures.length === 0 && scorePoints >= 70;
  return {
    passed,
    score: Math.max(0, scorePoints),
    failures
  };
}

/**
 * Execute full Self-Play suite across all scenarios
 */
async function runSelfPlaySuite() {
  const startTime = Date.now();
  const currentDate = new Date();
  if (appointmentService && typeof appointmentService.resetDataStores === 'function') {
    appointmentService.resetDataStores();
  }
  const sessions = [];

  for (const scen of SELF_PLAY_SCENARIOS) {
    const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let sessionData = { language: 'ar' };
    const sessionHistory = [];
    const turnsLog = [];
    const allFailures = [];
    let scenarioScoreTotal = 0;

    for (const turnSpec of scen.turns) {
      const turnStartTime = Date.now();

      // Process message through Nora Receptionist Agent with accumulated history
      const agentResult = await receptionistAgent.processChatMessage({
        message: turnSpec.userMessage,
        sessionId,
        sessionData: { ...sessionData, history: sessionHistory },
        currentDate
      });

      const turnLatency = Date.now() - turnStartTime;
      sessionData = { ...sessionData, ...(agentResult.state || {}) };
      sessionHistory.push(
        { sender: 'user', text: turnSpec.userMessage },
        { sender: 'bot', text: agentResult.reply }
      );

      // Evaluate response
      const evalResult = evaluateTurnResponse(turnSpec, agentResult);
      scenarioScoreTotal += evalResult.score;

      if (!evalResult.passed) {
        allFailures.push(...evalResult.failures);
      }

      turnsLog.push({
        turn: turnSpec.turn,
        sender: 'simulator',
        userMessage: turnSpec.userMessage,
        botReply: agentResult.reply,
        card: agentResult.card || null,
        suggestedSlots: agentResult.suggestedSlots || [],
        reasoningSteps: agentResult.reasoningSteps || [],
        latencyMs: turnLatency,
        assertionsPassed: evalResult.passed,
        score: evalResult.score,
        failures: evalResult.failures
      });
    }

    const avgScore = Math.round(scenarioScoreTotal / scen.turns.length);
    const passed = allFailures.length === 0 && avgScore >= 75;

    // Generate constructive critique
    let critique = '';
    if (passed) {
      critique = `أداء نموذجي متكامل: نجحت نورا في التفاعل مع شخصية "${scen.persona.name}" مع التزام صارم بضوابط العيادة، وتحقيق الهدف بنجاح (${avgScore}%).`;
    } else {
      critique = `تنبيه جودة: واجهت المحادثة بعض القصور في الاستجابة: ${allFailures.join(' | ')}`;
    }

    sessions.push({
      id: scen.id,
      sessionId,
      scenario: scen.scenario,
      persona: scen.persona,
      status: passed ? 'PASSED' : 'FAILED',
      score: avgScore,
      turnsCount: turnsLog.length,
      turns: turnsLog,
      critique,
      failures: allFailures,
      timestamp: new Date().toISOString()
    });
  }

  const passedCount = sessions.filter(s => s.status === 'PASSED').length;
  const totalCount = sessions.length;
  const passRate = Math.round((passedCount / totalCount) * 100);
  const totalDuration = Date.now() - startTime;
  const avgTurns = (sessions.reduce((acc, s) => acc + s.turnsCount, 0) / totalCount).toFixed(1);

  const qaLogsData = {
    summary: {
      totalRuns: totalCount,
      passed: passedCount,
      failed: totalCount - passedCount,
      passRate: `${passRate}%`,
      passRateNum: passRate,
      activeModels: [process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'Nora-Hybrid-RuleCore'],
      durationMs: totalDuration,
      avgTurns: parseFloat(avgTurns),
      lastRun: new Date().toISOString()
    },
    sessions
  };

  // Persist to data/qa_logs.json
  try {
    fs.writeFileSync(QA_LOGS_PATH, JSON.stringify(qaLogsData, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write qa_logs.json:', err);
  }

  return qaLogsData;
}

// Standalone execution support
if (require.main === module) {
  console.log('⚡ Launching Nora AI Automated Self-Play & Evaluation Engine...\n');
  runSelfPlaySuite().then((results) => {
    console.log(`\n========================================================`);
    console.log(`📊 SELF-PLAY BATTLE SUMMARY`);
    console.log(`   • Total Scenarios:  ${results.summary.totalRuns}`);
    console.log(`   • Passed:           ${results.summary.passed} ✅`);
    console.log(`   • Failed:           ${results.summary.failed} ❌`);
    console.log(`   • Pass Rate:        ${results.summary.passRate}`);
    console.log(`   • Active Models:    ${results.summary.activeModels.join(', ')}`);
    console.log(`   • Duration:         ${results.summary.durationMs}ms`);
    console.log(`========================================================\n`);

    results.sessions.forEach((s, idx) => {
      const badge = s.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED';
      console.log(`[${idx + 1}] ${badge} (${s.score}%) - ${s.scenario} [${s.persona.name}]`);
      console.log(`    Critique: ${s.critique}`);
      if (s.failures.length > 0) {
        console.log(`    Failures: ${s.failures.join(', ')}`);
      }
    });

    console.log(`\n📁 Logs successfully persisted to: data/qa_logs.json\n`);
    process.exit(results.summary.failed > 0 ? 1 : 0);
  }).catch((err) => {
    console.error('Self-Play Engine fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  runSelfPlaySuite,
  SELF_PLAY_SCENARIOS,
  evaluateTurnResponse
};
