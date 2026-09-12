/**
 * Predefined QA Test Suite for Nora AI Receptionist
 * Contains 22 edge cases, realistic personas, and strict guardrail verifications.
 */

const QA_TEST_SUITE = [
    {
        id: 'tc_01_name_greeting_guard',
        title: 'Entity Guard: Greeting Confusion ("أخبارك ايه")',
        category: 'name_guard',
        persona: 'مستخدم مصري يبدأ المحادثة بسؤال عام عن الحال دون ذكر اسمه',
        description: 'التأكد من عدم اعتبار جملة "أخبارك ايه" كاسم للمريض، وعدم مخاطبته بـ "يا أخبارك"',
        turns: [
            {
                userMessage: 'أخبارك ايه',
                assertions: {
                    mustNotInclude: ['أخبارك ايه', 'يا أخبارك'],
                    mustIncludeAny: ['الحمد لله', 'يا فندم', 'أهلاً'],
                    description: 'الرد بأدب دون التقاط تحية الحال كاسم'
                }
            }
        ]
    },
    {
        id: 'tc_02_name_casual_how_are_you',
        title: 'Entity Guard: Friendly Casual How-Are-You ("ازيك يا نورا")',
        category: 'name_guard',
        persona: 'مريض ودود يسأل عن حال الموظفة بالاسم',
        description: 'التأكد من عدم التقاط كلمة "نورا" أو "عاملة" كاسم المريض نفسه',
        turns: [
            {
                userMessage: 'ازيك يا نورا عاملة ايه النهاردة؟',
                assertions: {
                    mustNotInclude: ['يا نورا', 'أهلاً بك يا نورا'],
                    mustIncludeAny: ['الحمد لله', 'يا فندم', 'خدمتك'],
                    description: 'الرد على التحية بلباقة دون عكس اسم الموظفة على المريض'
                }
            }
        ]
    },
    {
        id: 'tc_03_explicit_name_prefix',
        title: 'Entity Guard: Explicit Name ("معاك أستاذ محمود السيد")',
        category: 'name_guard',
        persona: 'مريض يعرف نفسه بصيغة مصرية رسمية واضحة',
        description: 'التقاط الاسم الصريح بدقة وتخصيص اللقب والترحيب',
        turns: [
            {
                userMessage: 'مساء الخير، معاك أستاذ محمود السيد',
                assertions: {
                    mustInclude: ['محمود السيد'],
                    stateCheck: (state) => state.patientName && state.patientName.includes('محمود'),
                    description: 'التعرف على الاسم وتخزينه في ذاكرة الجلسة'
                }
            }
        ]
    },
    {
        id: 'tc_04_explicit_name_ana_esmy',
        title: 'Entity Guard: Direct Introduction ("أنا اسمي سارة حسن")',
        category: 'name_guard',
        persona: 'مريضة تعرف نفسها بصيغة "أنا اسمي"',
        description: 'استخراج الاسم وحفظه ومخاطبة المريضة به',
        turns: [
            {
                userMessage: 'أنا اسمي سارة حسن وعايزة استفسر عن المواعيد',
                assertions: {
                    mustInclude: ['سارة'],
                    stateCheck: (state) => state.patientName && state.patientName.includes('سارة'),
                    description: 'استخراج الاسم الصريح وتوجيه الحديث لها'
                }
            }
        ]
    },
    {
        id: 'tc_05_doctor_off_day_sunday',
        title: 'Schedule Validation: Off-Day Inquired (Dr. Ahmed on Sunday)',
        category: 'doctor_schedule',
        persona: 'مريض يطلب الحجز مع دكتور أحمد في يوم إجازته (الأحد)',
        description: 'رفض اختلاق مواعيد للأحد وإخطار المريض بأيام عمل دكتور أحمد (السبت، الإثنين، الأربعاء)',
        turns: [
            {
                userMessage: 'عايز أحجز كشف مع دكتور أحمد يوم الأحد الجاي',
                assertions: {
                    mustIncludeAny: ['مش موجود في اليوم ده', 'مش متاح', 'إجازة'],
                    mustInclude: ['السبت', 'الإثنين', 'الأربعاء'],
                    mustNotHaveSlots: true,
                    description: 'عدم اختلاق أي مواعيد للأحد وتوضيح أيام العمل الفعلية'
                }
            }
        ]
    },
    {
        id: 'tc_06_doctor_off_day_sara_monday',
        title: 'Schedule Validation: Off-Day Inquired (Dr. Sara on Monday)',
        category: 'doctor_schedule',
        persona: 'مريضة تطلب دكتورة سارة يوم الإثنين (إجازتها)',
        description: 'إخطار المريضة بأن دكتورة سارة متاحة فقط (الأحد، الثلاثاء، الخميس)',
        turns: [
            {
                userMessage: 'عايزة أحجز مع دكتورة سارة يوم الإثنين',
                assertions: {
                    mustIncludeAny: ['مش موجودة', 'مش موجود', 'مش متاح'],
                    mustInclude: ['الأحد', 'الثلاثاء', 'الخميس'],
                    mustNotHaveSlots: true,
                    description: 'توضيح أيام عمل دكتورة سارة وعدم فحص مواعيد الإثنين'
                }
            }
        ]
    },
    {
        id: 'tc_07_doctor_valid_day_ahmed_wed',
        title: 'Schedule Validation: Valid Day Slots (Dr. Ahmed on Wednesday)',
        category: 'doctor_schedule',
        persona: 'مريض يستفسر عن مواعيد دكتور أحمد في يوم عمل رسمي (الأربعاء)',
        description: 'استدعاء أداة فحص التوفر وعرض مواعيد الأربعاء (4:00، 5:00، 6:00، 7:00 م)',
        turns: [
            {
                userMessage: 'فاضيين يوم الأربعاء مع دكتور أحمد شريف؟',
                assertions: {
                    mustInclude: ['المواعيد المتاحة'],
                    mustIncludeAny: ['4:00', '5:00', '6:00', '7:00'],
                    mustTriggerTool: 'check_availability',
                    mustHaveSlots: true,
                    description: 'عرض المواعيد المتاحة مباشرة دون السؤال عن اليوم'
                }
            }
        ]
    },
    {
        id: 'tc_08_doctor_valid_day_sara_tue',
        title: 'Schedule Validation: Valid Day Slots (Dr. Sara on Tuesday)',
        category: 'doctor_schedule',
        persona: 'مريضة تسأل عن كشف الجلدية مع دكتورة سارة يوم الثلاثاء',
        description: 'فحص التوفر وعرض فترات عمل دكتورة سارة ليوم الثلاثاء',
        turns: [
            {
                userMessage: 'مواعيد دكتورة سارة يوم الثلاثاء إيه؟',
                assertions: {
                    mustInclude: ['المواعيد المتاحة'],
                    mustTriggerTool: 'check_availability',
                    mustHaveSlots: true,
                    description: 'عرض مواعيد دكتورة سارة ليوم الثلاثاء'
                }
            }
        ]
    },
    {
        id: 'tc_09_relative_date_tomorrow_sara',
        title: 'Relative Dates: Dynamic "بكرة" Recognition',
        category: 'relative_dates',
        persona: 'مستخدم يطلب المواعيد بلفظ نسبي "بكرة مع دكتورة سارة"',
        description: 'حساب تاريخ الغد ديناميكياً وتنفيذ أداة المواعيد فوراً دون السؤال "يوم إيه"',
        turns: [
            {
                userMessage: 'فاضيين بكرة مع دكتورة سارة؟',
                assertions: {
                    mustNotInclude: ['يوم إيه', 'أي يوم'],
                    mustTriggerTool: 'check_availability',
                    mustHaveSlots: true,
                    description: 'التعرف الفوري على يوم الغد دون استفسار redundant'
                }
            }
        ]
    },
    {
        id: 'tc_10_elderly_chaining_baadho',
        title: 'Contextual Chaining: "بعده" Following Prior Date',
        category: 'relative_dates',
        persona: 'مريض مسن يستفسر عن اليوم التالي بصيغة "طب بعده؟"',
        description: 'تتبع السلسلة الزمنية والتأكيد بلباقة "قصد حضرتك يوم ... اللي بعد ...؟"',
        turns: [
            {
                userMessage: 'فاضيين بكرة مع دكتور حسام فتحي؟',
                assertions: {
                    mustHaveSlots: true,
                    description: 'حفظ تاريخ الغد (الأحد) في ذاكرة الجلسة'
                }
            },
            {
                userMessage: 'طب بعده؟',
                assertions: {
                    mustIncludeAny: ['قصد حضرتك', 'اللي بعد'],
                    description: 'حساب التاريخ التالي للغد وتقديم تأكيد ودود للمسن'
                }
            }
        ]
    },
    {
        id: 'tc_11_elderly_chaining_two_days',
        title: 'Contextual Chaining: "وكمان يومين؟" Offset Tracking',
        category: 'relative_dates',
        persona: 'مريض يطلب تاريخ بعد الموعد الحالي بيومين',
        description: 'حساب +2 من آخر تاريخ نوقش وتوضيحه للمريض',
        turns: [
            {
                userMessage: 'فاضيين يوم الإثنين مع دكتور أحمد؟',
                assertions: {
                    mustHaveSlots: true,
                    description: 'مناقشة يوم الإثنين'
                }
            },
            {
                userMessage: 'وكمان يومين؟',
                assertions: {
                    mustInclude: ['الأربعاء'],
                    mustIncludeAny: ['بيومين', 'الأربعاء'],
                    description: 'القفز إلى يوم الأربعاء (+2 من الإثنين)'
                }
            }
        ]
    },
    {
        id: 'tc_12_non_exact_half_hour_matching',
        title: 'Time Matching: Half-Hour Request ("الساعة 6 ونص")',
        category: 'time_matching',
        persona: 'مريض يطلب ميعاداً غير محدد بالساعة التامة (6:30 م)',
        description: 'التعرف الذكي على الميعاد غير المطابق واقتراح أقرب موعدين متاحين (6:00 أو 7:00)',
        turns: [
            {
                userMessage: 'عايز أحجز مع دكتور أحمد يوم الأربعاء الساعة 6 ونص مساءً',
                assertions: {
                    mustInclude: ['6:00', '7:00'],
                    mustIncludeAny: ['معلش المتاح', 'أقرب', 'تماماً'],
                    description: 'عرض أقرب ميعادين واقتراح أحدهما بلباقة'
                }
            }
        ]
    },
    {
        id: 'tc_13_confirm_suggested_slot',
        title: 'State Machine: Confirming Suggested Alternative Slot',
        category: 'time_matching',
        persona: 'مريض يوافق على الموعد البديل المقترح من الذكاء الاصطناعي',
        description: 'قفل الميعاد المقترح والانتقال للخطوة 4 (طلب الهاتف للتأكيد)',
        turns: [
            {
                userMessage: 'عايز أحجز مع دكتور أحمد يوم الأربعاء الساعة 6 ونص مساءً',
                assertions: {
                    mustInclude: ['6:00'],
                    description: 'اقتراح 6:00'
                }
            },
            {
                userMessage: 'تمام يناسبني 6',
                assertions: {
                    mustIncludeAny: ['رقم', 'الواتساب', 'تليفون'],
                    stateCheck: (state) => state.bookingDraft && state.bookingDraft.time && state.bookingDraft.time.includes('6:00'),
                    description: 'قفل الساعة 6 في المسودة وطلب رقم الواتساب'
                }
            }
        ]
    },
    {
        id: 'tc_14_booked_slot_and_waitlist_offer',
        title: 'Waitlist Engine: Pre-booked Slot Collision (Mon 4:30 PM)',
        category: 'edge_cases',
        persona: 'مريض يطلب ميعاداً محجوزاً مسبقاً في السيناريو (د. أحمد الإثنين 4:30 م)',
        description: 'إبلاغ المريض بامتلاء الموعد وعرض البدائل مع إمكانية الانضمام لقائمة الانتظار',
        turns: [
            {
                userMessage: 'عايز أحجز مع دكتور أحمد يوم الإثنين الساعة 4:30 مساءً',
                assertions: {
                    mustIncludeAny: ['محجوز', 'بالكامل', 'اعتذر'],
                    mustIncludeAny: ['قائمة الانتظار', 'انتظار'],
                    stateCheck: (state) => Boolean(state.awaitingWaitlist || state.waitlistSlot),
                    description: 'تنبيه المريض بالحجز المسبق وعرض قائمة الانتظار'
                }
            }
        ]
    },
    {
        id: 'tc_15_waitlist_registration_confirmation',
        title: 'Waitlist Engine: Confirming Waitlist with Phone',
        category: 'edge_cases',
        persona: 'مريض يوافق على التسجيل في قائمة الانتظار ويقدم هاتفه',
        description: 'تشغيل أداة add_to_waitlist وتشفير بيانات المريض وتأكيد التسجيل',
        turns: [
            {
                userMessage: 'عايز أحجز مع دكتور أحمد يوم الإثنين الساعة 4:30 مساءً',
                assertions: {
                    mustIncludeAny: ['محجوز', 'انتظار']
                }
            },
            {
                userMessage: 'سجلني في قائمة الانتظار ورقمي 01011223344',
                assertions: {
                    mustIncludeAny: ['سجلت', 'قائمة الانتظار', 'هنتواصل'],
                    mustTriggerTool: 'add_to_waitlist',
                    description: 'إضافة المريض لقائمة الانتظار بنجاح'
                }
            }
        ]
    },
    {
        id: 'tc_16_egyptian_slang_and_typos',
        title: 'Slang & Typos: Severe Egyptian Slang ("عيز احغز كشف سنان")',
        category: 'slang_typos',
        persona: 'مستخدم يكتب بسرعة بأخطاء إملائية دارجة',
        description: 'تصحيح الأخطاء وفهم نية حجز كشف الأسنان وسؤال المريض عن اليوم المناسب',
        turns: [
            {
                userMessage: 'عيز احغز كشف سنان ضرووري',
                assertions: {
                    mustIncludeAny: ['أحمد شريف', 'تحب', 'يوم إيه', 'مواعيد'],
                    description: 'التعرف على كشف الأسنان دون إيقاف المحادثة'
                }
            }
        ]
    },
    {
        id: 'tc_17_invalid_phone_short',
        title: 'Validation Guard: Short Invalid Phone Number ("012345")',
        category: 'phone_validation',
        persona: 'مريض يدخل رقماً ناقصاً مكوناً من 6 أرقام فقط',
        description: 'رفض الرقم الناقص وتنبيه المريض بالصيغة المصرية المطلوبة (11 رقماً تبدأ بـ 01)',
        turns: [
            {
                userMessage: 'رقمي 012345',
                assertions: {
                    mustIncludeAny: ['غير صحيح', 'واتساب صحيح', '01012345678'],
                    mustNotInclude: ['تم الحجز', 'تأكيد الحجز'],
                    description: 'رفض الرقم الناقص ومطالبة المريض برقم هاتف مصري صحيح'
                }
            }
        ]
    },
    {
        id: 'tc_18_valid_phone_acceptance',
        title: 'Validation Guard: Valid 11-digit Egyptian Mobile',
        category: 'phone_validation',
        persona: 'مريض يقدم رقم هاتف محمول مصري صحيح',
        description: 'التحقق من صحة الرقم المصري (01123456789) وتخزينه في الجلسة',
        turns: [
            {
                userMessage: 'رقم الواتساب بتاعي هو 01123456789 واسمي أحمد علي',
                assertions: {
                    stateCheck: (state) => state.patientPhone === '01123456789' && state.patientName.includes('أحمد'),
                    description: 'تخزين الاسم ورقم الهاتف الصحيح'
                }
            }
        ]
    },
    {
        id: 'tc_19_side_question_price_during_booking',
        title: 'Context Switch: Price Inquiry ("الكشف بكام؟") No Repeat Slots',
        category: 'context_switch',
        persona: 'مريض يسأل عن سعر الكشف في منتصف حوار الحجز',
        description: 'الإجابة المباشرة عن الأسعار والحفاظ على مسودة الحجز دون إعادة سرد قائمة المواعيد',
        turns: [
            {
                userMessage: 'فاضيين يوم الإثنين مع دكتور أحمد؟',
                assertions: {
                    mustHaveSlots: true,
                    description: 'عرض المواعيد أول مرة'
                }
            },
            {
                userMessage: 'هو الكشف بكام؟',
                assertions: {
                    mustIncludeAny: ['350', 'جنيه', 'أسعار'],
                    mustNotHaveSlots: true,
                    description: 'بيان السعر دون إعادة سرد أزرار المواعيد بالكامل'
                }
            }
        ]
    },
    {
        id: 'tc_20_side_question_location_address',
        title: 'Context Switch: Clinic Address & Hours Inquiry',
        category: 'context_switch',
        persona: 'مريض يسأل عن عنوان العيادة أثناء ترتيب الحجز',
        description: 'عرض العنوان في الدقي ومواعيد العمل مع الحفاظ على مسار الحوار',
        turns: [
            {
                userMessage: 'عنوان العيادة فين بالضبط؟',
                assertions: {
                    mustInclude: ['الدقي', 'التحرير'],
                    mustNotHaveSlots: true,
                    description: 'تقديم العنوان الدقيق دون مسح بيانات الحجز'
                }
            }
        ]
    },
    {
        id: 'tc_21_today_date_inquiry',
        title: 'Direct Query: "هو النهاردة إيه وتاريخ كام؟"',
        category: 'relative_dates',
        persona: 'مريض يستفسر مباشرة عن يوم وتاريخ اليوم',
        description: 'الرد المباشر بيوم وتاريخ اليوم المحقون ديناميكياً بدلاً من الترحيب العام',
        turns: [
            {
                userMessage: 'هو النهاردة إيه؟',
                assertions: {
                    mustInclude: ['النهاردة', 'سبتمبر', '2026'],
                    description: 'ذكر اليوم والتاريخ بدقة ووضوح'
                }
            }
        ]
    },
    {
        id: 'tc_22_incomprehensible_gibberish',
        title: 'Robustness Guard: Keyboard Mash / Incomprehensible Input',
        category: 'edge_cases',
        persona: 'مستخدم ضغط أحرف عشوائية بدون معنى',
        description: 'طلب التوضيح بأدب دون التوقف أو اختلاق حجز',
        turns: [
            {
                userMessage: 'سيبشيسب شسيبشسي بشتنمك',
                assertions: {
                    mustIncludeAny: ['ما فهمتش', 'توضح', 'أساعدك'],
                    mustNotInclude: ['تم الحجز', 'المواعيد'],
                    description: 'طلب إعادة التوضيح بلباقة'
                }
            }
        ]
    },
    {
        id: 'tc_23_female_gender_alignment',
        title: 'Gender Alignment: Dynamic Female Pronouns & Verbs Agreement',
        category: 'gender_agreement',
        persona: 'مريضة (سارة حسن) تبدأ الحوار باسمها وعبارات تأنيث',
        description: 'مطابقة تامة لكافة الضمائر والأفعال مع المؤنث (أهلاً بكِ أستاذة سارة - نورتِ - حابة تستفسري - تحبي تحجزي)',
        turns: [
            {
                userMessage: 'أنا اسمي سارة حسن وعايزة استفسر عن المواعيد',
                assertions: {
                    mustInclude: ['أستاذة سارة حسن', 'نورتِ'],
                    mustIncludeAny: ['حابة تستفسري', 'تحبي'],
                    mustNotInclude: ['أستاذ سارة', 'حابب تستفسر', 'تحب تحجز'],
                    stateCheck: (state) => state.gender === 'female' && state.patientName === 'سارة حسن',
                    description: 'الترحيب المؤنث ومطابقة الأفعال بالكامل'
                }
            }
        ]
    },
    {
        id: 'tc_24_strict_entity_filtering',
        title: 'Strict Entity Filtering: Single Doctor Request (No Menu Dump)',
        category: 'entity_filtering',
        persona: 'مريض يسأل تحديداً عن دكتور أحمد شريف فقط',
        description: 'حظر سرد قائمة أطباء العيادة وحصر الرد على مواعيد دكتور أحمد وتخصصه فقط',
        turns: [
            {
                userMessage: 'مواعيد دكتور أحمد شريف إيه؟',
                assertions: {
                    mustInclude: ['د. أحمد شريف'],
                    mustNotInclude: ['سارة محمود', 'حسام فتحي', 'مريم نبيل'],
                    description: 'الرد حصراً على دكتور أحمد ومنع إغراق العميل بقائمة الأطباء الكاملة'
                }
            }
        ]
    },
    {
        id: 'tc_25_slot_negotiation_typo_lockin',
        title: 'Negotiation & Lock-in: Handling "خيلها 6" Typo Without Day/Time Looping',
        category: 'time_matching',
        persona: 'مريض يختار ميعاداً بديلاً مع خطأ إملائي "خيلها 6"',
        description: 'تثبيت وقفل الساعة 6:00 مساءً والانتقال مباشرة لطلب الواتساب دون تكرار السؤال عن اليوم',
        turns: [
            {
                userMessage: 'فاضيين يوم الأربعاء مع دكتور أحمد؟',
                assertions: {
                    mustHaveSlots: true,
                    description: 'عرض مواعيد الأربعاء'
                }
            },
            {
                userMessage: 'خيلها 6',
                assertions: {
                    mustIncludeAny: ['الواتساب', 'واتساب', 'رقم'],
                    mustNotInclude: ['تحب حضرتك تحجز يوم إيه'],
                    stateCheck: (state) => state.bookingDraft && state.bookingDraft.time && state.bookingDraft.time.includes('6:00'),
                    description: 'قفل الساعة 6:00 فوراً والانتقال لطلب رقم الواتساب'
                }
            }
        ]
    },
    {
        id: 'tc_26_today_finished_slots_guard',
        title: 'Date Awareness: Finished Today Slots Guard & Next Working Day Offer',
        category: 'relative_dates',
        mockDate: new Date(2026, 8, 12, 23, 0),
        persona: 'مريض يطلب كشفاً بعد انتهاء مواعيد اليوم دون قفز صامت للأسبوع القادم',
        description: 'تنبيه المريض بأن مواعيد اليوم انتهت وعرض أول يوم عمل قادم صراحة',
        turns: [
            {
                userMessage: 'عايز أحجز مع دكتور أحمد النهاردة الساعة 4:00 مساءً',
                assertions: {
                    mustIncludeAny: ['انتهى', 'خلصت', 'انتهت'],
                    mustInclude: ['أول يوم عمل قادم'],
                    description: 'إعلام المريض بانتهاء الموعد وعرض أول يوم عمل قادم بوضوح'
                }
            }
        ]
    },
    {
        id: 'tc_27_standalone_name_awaiting_state',
        title: 'Entity Guard: Standalone Name Extraction in AWAITING_NAME State ("محمود")',
        category: 'name_guard',
        persona: 'مريض يسأل تحية ثم يرد باسمه فقط ككلمة واحدة مجردة',
        description: 'التقاط الاسم المفرد مباشرة دون تكرار السؤال عن الاسم والانتقال للتحية والاستفسار',
        turns: [
            {
                userMessage: 'صباح الخير',
                assertions: {
                    mustInclude: ['اسم حضرتك'],
                    stateCheck: (state) => state.awaitingName === true,
                    description: 'طلب اسم المريض وتفعيل حالة انتظار الاسم'
                }
            },
            {
                userMessage: 'محمود',
                assertions: {
                    mustInclude: ['أستاذ محمود', 'إزاي أقدر أساعدك'],
                    stateCheck: (state) => state.userName === 'محمود' && !state.awaitingName,
                    description: 'استخراج الاسم وحفظه والانتقال لسؤال المريض كيف نساعده'
                }
            }
        ]
    },
    {
        id: 'tc_28_waitlist_intent_routing_no_slots_repeat',
        title: 'Waitlist Engine: Intent Routing Without Slots Redisplay ("لا سجل رقمي أفضل")',
        category: 'edge_cases',
        persona: 'مريض يختار الانضمام لقائمة الانتظار عند امتلاء الموعد بدلاً من البدائل',
        description: 'تحويل الطلب فوراً لمسار الانتظار وطلب الهاتف ثم تأكيد التسجيل ومنع إعادة عرض المواعيد',
        turns: [
            {
                userMessage: 'عايز أحجز مع دكتور أحمد يوم الإثنين الساعة 4:30 مساءً',
                assertions: {
                    mustIncludeAny: ['محجوز', 'قائمة الانتظار']
                }
            },
            {
                userMessage: 'لا سجل رقمي أفضل',
                assertions: {
                    mustIncludeAny: ['رقم الواتساب', 'الواتساب', 'نسجلك'],
                    mustNotInclude: ['• 5:30 مساءً', 'المواعيد المتاحة'],
                    stateCheck: (state) => Boolean(state.awaitingWaitlist && state.awaitingPhone),
                    description: 'طلب رقم الواتساب لقائمة الانتظار دون إعادة عرض المواعيد'
                }
            },
            {
                userMessage: '01011223344',
                assertions: {
                    mustInclude: ['تسجل طلبك في قائمة الانتظار'],
                    mustIncludeAny: ['د. أحمد شريف', 'هنتواصل'],
                    mustTriggerTool: 'add_to_waitlist',
                    description: 'تأكيد التسجيل في قائمة الانتظار بنجاح'
                }
            }
        ]
    },
    {
        id: 'tc_29_unisex_name_gender_neutral_greeting',
        title: 'Gender Alignment: Unisex Name ("نور") Initial Neutral Greeting & Feminine Lock',
        category: 'name_guard',
        persona: 'مريضة اسمها نور تبدأ باسمها دون تحديد الجنس ثم تذكر لفظ تأنيث',
        description: 'الرد بصيغة محايدة (أهلاً بك يا فندم) ثم قفل التأنيث عند ظهور "عايزة"',
        turns: [
            {
                userMessage: 'صباح الخير',
                assertions: {
                    mustInclude: ['اسم حضرتك'],
                    stateCheck: (state) => state.awaitingName === true
                }
            },
            {
                userMessage: 'نور',
                assertions: {
                    mustInclude: ['أهلاً بك يا فندم', 'نورت عيادتنا'],
                    mustNotInclude: ['أستاذ نور', 'أستاذة نور'],
                    stateCheck: (state) => state.userName === 'نور' && state.userGender === 'unisex',
                    description: 'الرد المحايد دون افتراض جنس المريض مسبقاً'
                }
            },
            {
                userMessage: 'عايزة أكشف أسنان يوم الإثنين',
                assertions: {
                    mustInclude: ['تحبي'],
                    stateCheck: (state) => state.userGender === 'female' && state.gender === 'female',
                    description: 'قفل جنس المريض كمؤنث واستخدام صيغة تحبي'
                }
            }
        ]
    },
    {
        id: 'tc_30_unisex_name_dynamic_masculine_lock',
        title: 'Gender Alignment: Unisex Name ("إسلام") Dynamic Masculine Lock',
        category: 'name_guard',
        persona: 'مريض اسمه إسلام يذكر اسمه ثم يستخدم صيغة التذكير',
        description: 'استخدام تحية محايدة في البداية ثم قفل التذكير واستخدام صيغ المذكر',
        turns: [
            {
                userMessage: 'معاك إسلام',
                assertions: {
                    mustInclude: ['أهلاً بك يا فندم'],
                    mustNotInclude: ['أستاذة'],
                    stateCheck: (state) => state.userName === 'إسلام' && state.userGender === 'unisex'
                }
            },
            {
                userMessage: 'عايز أعرف مواعيد الأسنان الأربعاء',
                assertions: {
                    mustInclude: ['تحب'],
                    stateCheck: (state) => state.userGender === 'male' && state.gender === 'male',
                    description: 'قفل جنس المريض كذكر واستخدام صيغة تحب'
                }
            }
        ]
    },
    {
        id: 'tc_31_service_catalog_laser_teeth_whitening_collision',
        title: 'Service Catalog: Laser Teeth Whitening Collision Guard ("جلسة تبييض الأسنان بالليزر (Zoom)")',
        category: 'entity_filtering',
        persona: 'مريض يستفسر عن تبييض الأسنان بالليزر (Zoom)',
        description: 'التأكد من استعلام دليل الخدمات أولاً وتوجيه الطلب حصراً لدكتور أحمد شريف وقفل التخصص في طب الأسنان ومنع التوجيه للجلدية رغم وجود كلمة ليزر',
        turns: [
            {
                userMessage: 'جلسة تبييض الأسنان بالليزر (Zoom)',
                assertions: {
                    mustInclude: ['د. أحمد شريف', 'طب الأسنان', 'تبييض الأسنان بالليزر', 'المتاحة هي:'],
                    mustNotInclude: ['سارة محمود', 'الجلدية'],
                    stateCheck: (state) => state.bookingDraft && state.bookingDraft.doctor === 'د. أحمد شريف',
                    description: 'استعلام دليل الخدمات أولاً وتطبيق قفل التخصص والرد بنمط المواعيد المتاحة حصراً'
                }
            }
        ]
    },
    {
        id: 'tc_32_explicit_doctor_priority_over_procedure_keyword',
        title: 'Strict Entity Priority: Explicit Doctor Mention Overrides Procedure Keyword ("عايز كشف مع د. أحمد شريف جلسة ليزر")',
        category: 'entity_filtering',
        persona: 'مريض يحدد دكتور أحمد صراحة ويذكر كلمة ليزر',
        description: 'قفل الطبيب حصراً على دكتور أحمد شريف بناءً على قاعدة الأولوية المطلقة للاسم الصريح',
        turns: [
            {
                userMessage: 'عايز كشف مع د. أحمد شريف جلسة ليزر',
                assertions: {
                    mustInclude: ['د. أحمد شريف'],
                    mustNotInclude: ['سارة محمود', 'الجلدية'],
                    stateCheck: (state) => state.bookingDraft && state.bookingDraft.doctor === 'د. أحمد شريف',
                    description: 'الأولوية الصريحة للطبيب المذكور ومنع الانحراف لطبيب آخر'
                }
            }
        ]
    },
    {
        id: 'tc_33_emergency_interceptor',
        title: 'Emergency Interceptor: Critical Case Safety Override ("عندي نزيف حاد وألم لا يطاق")',
        category: 'emergency',
        persona: 'مريض يعاني من نزيف حاد وألم لا يطاق يستدعي الطوارئ الفورية',
        description: 'تفعيل معترض الطوارئ فوراً ووقف الحجز وإلغاء المسودات وتوجيه المريض لأقرب قسم طوارئ بالرسالة الإلزامية',
        turns: [
            {
                userMessage: 'عندي نزيف حاد في أسناني وألم لا يطاق مش قادر أستنى',
                assertions: {
                    mustInclude: [
                        'يا فندم سلامتك ألف سلامة!',
                        'الحالات الحادّة والطارئة بتتطلب توجه فوراً لأقرب قسم طوارئ أو مستشفى',
                        'يرجى عدم الانتظار للحجز العادي والتوجه فوراً لأقرب مركز طبي'
                    ],
                    mustNotInclude: ['المواعيد المتاحة', 'تحب أحجز'],
                    stateCheck: (state) => state.isEmergency === true && !state.bookingDraft,
                    description: 'وقف عملية الحجز فوراً وتوجيه المريض لأقرب قسم طوارئ'
                }
            }
        ]
    },
    {
        id: 'tc_34_greeting_guard_in_awaiting_name',
        title: 'Entity Guard: Greeting Interception in AWAITING_NAME State ("الحمد لله أخبارك إيه")',
        category: 'name_guard',
        persona: 'مريض يُطلب منه اسمه فيرد بتحية حال عادية',
        description: 'الرد بأدب دون اعتبار التحية اسماً وإعادة طلب الاسم ثم استخراج الاسم الحقيقي بدقة',
        turns: [
            {
                userMessage: 'مساء الخير',
                assertions: {
                    mustInclude: ['اسم حضرتك'],
                    stateCheck: (state) => state.awaitingName === true
                }
            },
            {
                userMessage: 'الحمد لله أخبارك إيه',
                assertions: {
                    mustInclude: ['الحمد لله تمام وبخير يا فندم!', 'يشرفني معرفة اسم حضرتك الكريم؟'],
                    mustNotInclude: ['أستاذ الحمد لله', 'أستاذة الحمد لله'],
                    stateCheck: (state) => state.awaitingName === true && !state.patientName,
                    description: 'الرد بلباقة دون حفظ التحية كاسم'
                }
            },
            {
                userMessage: 'علي حسام',
                assertions: {
                    mustInclude: ['أستاذ علي حسام', 'إزاي أقدر أساعدك النهاردة؟'],
                    stateCheck: (state) => state.userName === 'علي حسام' && !state.awaitingName,
                    description: 'التقاط الاسم الحقيقي المكون من كلمتين وحفظه'
                }
            }
        ]
    },
    {
        id: 'tc_35_strict_11_digit_phone_validation',
        title: 'Input Validation: Incomplete Mobile Number Guard ("0101234")',
        category: 'input_validation',
        persona: 'مريض يدخل 7 أرقام بدلاً من 11 رقماً للهاتف المحمول المصري',
        description: 'رفض الرقم غير المكتمل بالرسالة الإلزامية ومنع الحفظ ثم قبول الرقم بعد تصحيحه',
        turns: [
            {
                userMessage: 'عايز أحجز كشف أسنان يوم الإثنين الساعة 5:30 مساءً باسم محمود',
                assertions: {
                    mustInclude: ['رقم الواتساب'],
                    stateCheck: (state) => Boolean(state.awaitingPhone)
                }
            },
            {
                userMessage: '0101234',
                assertions: {
                    mustInclude: ['عذراً، رقم المحمول المكتوب غير مكتمل. يرجى كتابة رقم الموبايل المصري المكون من 11 رقم (مثال: 01012345678)'],
                    stateCheck: (state) => !state.patientPhone && state.awaitingPhone === true,
                    description: 'رفض الرقم غير المكتمل برسالة التحقق الإلزامية'
                }
            },
            {
                userMessage: '01012345678',
                assertions: {
                    mustInclude: ['تم تأكيد حجز حضرتك', '01012345678'],
                    stateCheck: (state) => state.patientPhone === '01012345678',
                    description: 'تأكيد الحجز بنجاح بعد إدخال الرقم الصحيح المكون من 11 رقماً'
                }
            }
        ]
    },
    {
        id: 'tc_36_dynamic_gender_fadiltak_marker',
        title: 'Gender Alignment: Unisex Name ("رضا") with Masculine Clue ("فاضيلك")',
        category: 'name_guard',
        persona: 'مريض اسمه رضا يستخدم تعبير التذكير "فاضيلك"',
        description: 'قفل جنس المريض كمذكر ومخاطبته بصيغة تحب المذكر وتجنب التأنيث',
        turns: [
            {
                userMessage: 'أنا رضا وفاضيلك يوم السبت',
                assertions: {
                    mustInclude: ['تحب'],
                    mustNotInclude: ['تحبي', 'أستاذة رضا'],
                    stateCheck: (state) => state.userGender === 'male' && state.gender === 'male',
                    description: 'التعرف على مؤشر التذكير فاضيلك وقفل الجنس كمذكر'
                }
            }
        ]
    },
    {
        id: 'tc_37_multi_branch_selection_and_switch',
        title: 'Multi-Branch Engine: Branch Disambiguation & Switching (Damanhour vs Alex)',
        category: 'branch_logic',
        persona: 'مريض يستفسر عن الفروع ثم يبدل بين فرع دمنهور وفرع الإسكندرية',
        description: 'التوجيه الدقيق بين فرع دمنهور وفرع الإسكندرية ودعم التبديل السلس دون فقدان السياق',
        turns: [
            {
                userMessage: 'عندكم فروع ايه؟',
                assertions: {
                    mustInclude: ['فرع دمنهور', 'فرع الإسكندرية', 'تحب تحجز في فرع دمنهور ولا فرع الإسكندرية؟'],
                    description: 'عرض فروع العيادة وسؤال المريض عن الفرع المفضل'
                }
            },
            {
                userMessage: 'ممكن أعرف مواعيد فرع الإسكندرية؟',
                assertions: {
                    mustInclude: ['مواعيد فرع الإسكندرية', 'د. حسام فتحي', 'د. مريم نبيل', 'د. أحمد شريف'],
                    stateCheck: (state) => state.branch_id === 'alex',
                    description: 'استرجاع مواعيد أطباء فرع الإسكندرية حصراً'
                }
            },
            {
                userMessage: 'طيب أكمل في دمنهور',
                assertions: {
                    mustInclude: ['فرع دمنهور'],
                    stateCheck: (state) => state.branch_id === 'damanhour',
                    description: 'التبديل إلى فرع دمنهور واستكمال الحوار'
                }
            }
        ]
    },
    {
        id: 'tc_38_knowledge_base_insurance_with_booking_retention',
        title: 'Knowledge Base: Medical Insurance Inquiry with Context Retention',
        category: 'knowledge_base',
        persona: 'مريض يستفسر عن شركات التأمين في منتصف ترتيب الحجز',
        description: 'الرد بقائمة شركات التأمين المعتمدة والاحتفاظ بمسودة الحجز والعودة لاستكمالها',
        turns: [
            {
                userMessage: 'عايز كشف مع دكتور أحمد يوم الأربعاء الساعة 6:00 مساءً',
                assertions: {
                    mustInclude: ['6:00', 'الواتساب'],
                    stateCheck: (state) => state.bookingDraft && state.bookingDraft.date
                }
            },
            {
                userMessage: 'هل متعاقدين مع شركات التأمين زي بوبا أو أكسا؟',
                assertions: {
                    mustInclude: ['بوبا Bupa', 'أكسا AXA', 'ميدنت MedNet', 'نكمل حجز ميعاد حضرتك'],
                    stateCheck: (state) => state.bookingDraft && state.bookingDraft.date && state.bookingDraft.time,
                    description: 'الرد بشبكة التأمين والاحتفاظ بالموعد المختار دون مسحه'
                }
            }
        ]
    }
];

module.exports = QA_TEST_SUITE;

