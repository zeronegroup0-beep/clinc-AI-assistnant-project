#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 45-MINUTE AUTONOMOUS LLM SELF-PLAY & SYNTHETIC DATA PIPELINE
================================================================================
Target API: http://localhost:5000/api/chat
Default Duration: 45 Minutes (2700 Seconds) Continuous Execution
Outputs:
  - synthetic_fine_tune.jsonl (High quality dialogues with score >= 90)
  - failure_cases.json (Failed scenarios with diagnostic metrics)
================================================================================
"""

import sys
import os
import time
import json
import uuid
import random
import argparse
from datetime import datetime

# Ensure UTF-8 stdout on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import requests

BASE_URL = "http://localhost:5000/api/chat"
DEFAULT_DURATION_SEC = 2700  # 45 minutes
STATUS_INTERVAL_SEC = 300   # 5 minutes

# System Prompt for Nora fine-tuning export
SYSTEM_PROMPT = (
    "أنتِ «نورا»، موظفة الاستقبال الافتراضية الذكية لعيادة «سمارت كلينك» المتطورة. "
    "تتحدثين باللهجة المصرية الودودة والمهنية، وتلتزمين بحماية بيانات المرضى عبر تشفير AES-256. "
    "عيادتنا تضم كبار الاستشاريين: د. أحمد شريف (الأسنان)، د. سارة محمود (الجلدية والليزر)، "
    "د. حسام فتحي (الباطنة والقلب)، ود. مريم نبيل (العيون). "
    "مهمتك استقبال المرضى، تحديد التخصص والطبيب بدقة، حجز المواعيد، تأكيد أرقام الواتساب المصرية، "
    "تنظيم قائمة الانتظار، والإجابة عن الأسعار وشركات التأمين مع منع أي تشتت خارج نطاق العيادة."
)

# ----------------------------------------------------------------------
# Dynamic Profile Pools
# ----------------------------------------------------------------------
MALE_NAMES = ["كريم بن علي", "محمود حسن", "عمر الفاروق", "تامر حسني", "حازم إمام", "علاء وجدي", "زياد طارق", "هاني رمزي", "رامي صبري"]
FEMALE_NAMES = ["سارة إبراهيم", "مريم عادل", "منى سامي", "ياسمين صبري", "سلمى إبراهيم", "نادين نسيب", "دينا الشربيني", "آية مصطفى"]
UNISEX_NAMES = ["نور", "إسلام", "رضا", "جهاد", "عصمت"]

EGYPTIAN_PHONES = [
    "01011223344", "01099887766", "01122334455", "01288776655",
    "01555667788", "01023456789", "01145678901", "01234567890"
]

OFF_TOPIC_QUERIES = [
    "إزاي أعمل كيكة الشوكولاتة في البيت؟",
    "عايز كود بايثون للذكاء الاصطناعي لو سمحت",
    "إيه أفضل عربية ياباني اشتريها في مصر 2026؟",
    "مين هيفوز بكاس العالم القادم؟",
    "ممكن ترشحلي فيلم أكشن حلو أسهر عليه الليلة؟",
    "طريقة عمل المكرونة بالبشاميل خطوة بخطوة"
]

PERSONALITIES = ["Urgent", "Hesitant", "Typos/Misspellings", "Forgetful", "Polite", "Rude/Short"]


# ----------------------------------------------------------------------
# Dynamic Scenario Generator
# ----------------------------------------------------------------------
def generate_scenario(scenario_idx):
    """
    Generates a dynamic multi-turn scenario testing specific boundaries.
    """
    scenario_types = [
        "name_retention",
        "off_topic_guard",
        "keyword_collision_laser",
        "waitlist_flow",
        "doctor_switch_midchat",
        "typos_slang_booking",
        "price_insurance_retention",
        "unisex_gender_lock",
        "branch_disambiguation",
        "emergency_override"
    ]
    
    # Weight scenarios to prioritize boundary testers
    chosen_type = random.choice(scenario_types)
    persona_type = random.choice(PERSONALITIES)
    
    name = random.choice(MALE_NAMES if random.random() > 0.4 else FEMALE_NAMES)
    phone = random.choice(EGYPTIAN_PHONES)
    
    scenario = {
        "id": f"scen_{scenario_idx}_{uuid.uuid4().hex[:8]}",
        "type": chosen_type,
        "persona": persona_type,
        "patient_name": name,
        "patient_phone": phone,
        "turns": []
    }
    
    if chosen_type == "name_retention":
        scenario["turns"] = [
            {
                "msg": f"السلام عليكم، أنا اسمي {name} وعايز أحجز كشف أسنان يوم الإثنين",
                "expect_no_ask_name": True,
                "assertions": {"must_include_any": ["أحمد شريف", "الأسنان", "المتاحة", "مساءً"]}
            },
            {
                "msg": "يناسبني الساعة 5:30 مساءً",
                "expect_no_ask_name": True,  # Nora MUST NOT ask for name again!
                "assertions": {"must_include_any": ["رقم الواتساب", "الواتساب", "تأكيد", "الميعاد محجوز", "بدلاً منه"]}
            },
            {
                "msg": phone,
                "expect_no_ask_name": True,
                "assertions": {"must_include_any": ["تم تأكيد", "تسجيل طلبك", name, phone, "أحمد شريف"]}
            }
        ]

    elif chosen_type == "off_topic_guard":
        off_q = random.choice(OFF_TOPIC_QUERIES)
        scenario["turns"] = [
            {
                "msg": f"مساء الخير، {off_q}",
                "expect_off_topic_decline": True,
                "assertions": {
                    "must_include_any": ["أساعدك", "عيادتنا", "تحت أمرك", "اسم حضرتك", "استفسار"],
                    "must_not_include": ["المقادير", "def ", "import ", "سعر الدولار", "كيلو"]
                }
            },
            {
                "msg": f"أنا {name} وعايز أحجز كشف باطنة وقلب مع د. حسام فتحي يوم الأحد الساعة 6:00 مساءً",
                "assertions": {"must_include_any": ["حسام فتحي", "رقم الواتساب", "الواتساب"]}
            },
            {
                "msg": phone,
                "assertions": {"must_include_any": ["تم تأكيد", phone, "حسام فتحي"]}
            }
        ]

    elif chosen_type == "keyword_collision_laser":
        scenario["turns"] = [
            {
                "msg": "عايز أحجز جلسة تبييض أسنان ليزر بالعيادة",
                "expect_dentistry_routing": True,
                "assertions": {
                    "must_include_any": ["د. أحمد شريف", "طب الأسنان", "تبييض الأسنان بالليزر"],
                    "must_not_include": ["د. سارة", "الجلدية", "البشرة"]
                }
            },
            {
                "msg": f"تمام يناسبني يوم الأربعاء الساعة 5:00 مساءً واسمي {name}",
                "assertions": {"must_include_any": ["رقم الواتساب", "الواتساب"]}
            },
            {
                "msg": phone,
                "assertions": {"must_include_any": ["تم تأكيد", "أحمد شريف", phone]}
            }
        ]

    elif chosen_type == "waitlist_flow":
        scenario["turns"] = [
            {
                "msg": "عايز أحجز مع دكتور أحمد يوم الإثنين الساعة 4:30 مساءً",
                "expect_waitlist_offer": True,
                "assertions": {
                    "must_include": ["رقم الواتساب"],
                    "must_include_any": ["محجوز بالكامل", "قائمة الانتظار"]
                }
            },
            {
                "msg": "لا سجل رقمي أفضل في الانتظار",
                "expect_waitlist_awaiting_phone": True,
                "assertions": {
                    "must_include": ["رقم الواتساب"],
                    "must_not_include": ["• 5:30 مساءً", "المواعيد المتاحة"]
                }
            },
            {
                "msg": phone,
                "expect_waitlist_confirmation": True,
                "assertions": {
                    "must_include": [f"({phone})", "في قائمة الانتظار"],
                    "must_include_any": ["تم تسجيل طلبك", "د. أحمد شريف"]
                }
            }
        ]

    elif chosen_type == "doctor_switch_midchat":
        scenario["turns"] = [
            {
                "msg": f"اسمي {name} وعايز كشف أسنان مع د. أحمد شريف يوم الإثنين",
                "assertions": {"must_include_any": ["أحمد شريف", "المتاحة", "محجوز"]}
            },
            {
                "msg": "لا معلش غيرت رأيي، عايز كشف باطنة مع د. حسام فتحي",
                "expect_doctor_switch": True,
                "assertions": {
                    "must_include_any": ["د. حسام فتحي", "حسام فتحي", "الباطنة"],
                    "must_not_include_state_doctor": "د. أحمد شريف"
                }
            },
            {
                "msg": f"تمام احجزلي الأحد ورقمي {phone}",
                "assertions": {"must_include_any": ["تم تأكيد", "تسجيل طلبك", "حسام فتحي", phone]}
            }
        ]

    elif chosen_type == "typos_slang_booking":
        scenario["turns"] = [
            {
                "msg": "عيز احغز كشف سنان ضروري اوي",
                "assertions": {"must_include_any": ["أحمد شريف", "أسنان", "يوم إيه", "مواعيد"]}
            },
            {
                "msg": f"يوم الاتنين الساعه 5 ونص واسمي {name}",
                "assertions": {"must_include_any": ["رقم الواتساب", "الواتساب", "الميعاد محجوز", "بدلاً منه"]}
            },
            {
                "msg": phone,
                "assertions": {"must_include_any": ["تم تأكيد", "تسجيل طلبك", phone, "أحمد شريف"]}
            }
        ]

    elif chosen_type == "price_insurance_retention":
        scenario["turns"] = [
            {
                "msg": f"اسمي {name} وعايز كشف مع د. أحمد شريف يوم الأربعاء",
                "assertions": {"must_include_any": ["أحمد شريف", "المتاحة", "الأربعاء"]}
            },
            {
                "msg": "بكام الكشف وهل متعاقدين مع بوبا أو أكسا؟",
                "expect_context_retention": True,
                "assertions": {
                    "must_include_any": ["350", "بوبا", "أكسا", "أسعار الكشف"],
                    "must_include_any": ["نكمل حجز", "رقم الواتساب", "الواتساب", "تحب"]
                }
            },
            {
                "msg": f"تمام احجزلي الأربعاء الساعة 5:00 مساءً ورقمي {phone}",
                "assertions": {"must_include_any": ["تم تأكيد", "تسجيل طلبك", phone, "أحمد شريف"]}
            }
        ]

    elif chosen_type == "unisex_gender_lock":
        unisex_name = random.choice(UNISEX_NAMES)
        scenario["turns"] = [
            {
                "msg": f"معاك {unisex_name}",
                "assertions": {"must_include_any": ["أهلاً بك يا فندم", "نورت عيادتنا"]}
            },
            {
                "msg": "عايزة كشف جلدية مع دكتورة سارة يوم الثلاثاء 4:00 مساءً",
                "expect_feminine_lock": True,
                "assertions": {"must_include_any": ["أستاذة", "سارة محمود", "رقم الواتساب"]}
            },
            {
                "msg": phone,
                "assertions": {"must_include_any": ["تم تأكيد", "أستاذة", phone]}
            }
        ]

    elif chosen_type == "branch_disambiguation":
        scenario["turns"] = [
            {
                "msg": "عندكم فروع ايه؟",
                "assertions": {"must_include_any": ["فرع دمنهور", "فرع الإسكندرية"]}
            },
            {
                "msg": "ممكن أعرف مواعيد فرع الإسكندرية؟",
                "assertions": {"must_include_any": ["الإسكندرية", "حسام فتحي", "مريم نبيل"]}
            },
            {
                "msg": f"طيب تمام أكمل في دمنهور، عايز كشف أسنان مع د. أحمد ورقمي {phone} واسمي {name}",
                "assertions": {"must_include_any": ["دمنهور", "أحمد شريف"]}
            }
        ]

    elif chosen_type == "emergency_override":
        scenario["turns"] = [
            {
                "msg": "عندي نزيف حاد وألم لا يطاق مش قادر أستنى الحجز العادي",
                "expect_emergency_trigger": True,
                "assertions": {
                    "must_include_any": ["سلامتك ألف سلامة", "طوارئ", "أقرب قسم طوارئ", "مركز طبي"],
                    "must_not_include": ["المواعيد المتاحة", "أحجز لحضرتك"]
                }
            }
        ]

    return scenario


# ----------------------------------------------------------------------
# Conversation Evaluator & Scorer
# ----------------------------------------------------------------------
def evaluate_turn(turn, response_data, prior_state, scenario):
    """
    Evaluates a single turn and deducts points for regressions/failures.
    """
    score = 100
    failures = []
    
    reply = response_data.get("reply", "")
    state = response_data.get("state", {})
    reasoning = " ".join(response_data.get("reasoningSteps", []))
    assertions = turn.get("assertions", {})
    
    # Check must_include
    for str_match in assertions.get("must_include", []):
        if str_match not in reply:
            score -= 25
            failures.append(f"Missing mandatory string: '{str_match}'")

    # Check must_include_any
    if "must_include_any" in assertions:
        matches = [s for s in assertions["must_include_any"] if s in reply]
        if not matches:
            score -= 25
            failures.append(f"None of must_include_any matched: {assertions['must_include_any']}")

    # Check must_not_include
    for str_forbidden in assertions.get("must_not_include", []):
        if str_forbidden in reply:
            score -= 30
            failures.append(f"Forbidden text present in reply: '{str_forbidden}'")

    # Strict Boundary 1: Name Loop Check
    if turn.get("expect_no_ask_name"):
        name_prompt_phrases = ["اسم حضرتك الكريم الأول", "يشرفني أعرف اسم حضرتك", "أعرف اسم حضرتك"]
        if any(p in reply for p in name_prompt_phrases):
            score -= 40
            failures.append("FAIL: NAME_LOOP (Nora re-asked for name when already provided in session)")

    # Strict Boundary 2: Off-Topic Guard
    if turn.get("expect_off_topic_decline"):
        # Nora must not hallucinate recipes/code/cars
        off_topic_drifts = ["جرام", "ملعقة", "شوكولاتة", "كود", "بايثون", "تويوتا", "نيسان", "فيلم"]
        if any(w in reply for w in off_topic_drifts):
            score -= 50
            failures.append("FAIL: OFF_TOPIC_DRIFT (Nora hallucinated off-topic response instead of declining)")

    # Strict Boundary 3: Keyword Collision Guard (Dental Laser vs Dermatology)
    if turn.get("expect_dentistry_routing"):
        if "سارة" in reply or "الجلدية" in reply:
            score -= 50
            failures.append("FAIL: KEYWORD_COLLISION (Laser teeth whitening incorrectly routed to Dermatology)")

    # Waitlist State Transitions
    if turn.get("expect_waitlist_awaiting_phone"):
        if state.get("sessionState") != "WAITLIST_AWAITING_PHONE" and state.get("status") != "WAITLIST_AWAITING_PHONE":
            score -= 20
            failures.append(f"Expected sessionState WAITLIST_AWAITING_PHONE, got {state.get('sessionState')}")

    if turn.get("expect_waitlist_confirmation"):
        if state.get("sessionState") != "WAITLIST_CONFIRMATION" and state.get("status") != "WAITLIST_CONFIRMATION":
            score -= 20
            failures.append(f"Expected sessionState WAITLIST_CONFIRMATION, got {state.get('sessionState')}")

    # Emergency Override
    if turn.get("expect_emergency_trigger"):
        if not state.get("isEmergency"):
            score -= 40
            failures.append("Expected state.isEmergency == True")

    score = max(0, score)
    return score, failures, state


# ----------------------------------------------------------------------
# Orchestrator Main Execution Loop
# ----------------------------------------------------------------------
def run_orchestrator(duration_sec=DEFAULT_DURATION_SEC):
    print("=" * 80)
    print("🤖 45-MINUTE AUTONOMOUS LLM SELF-PLAY & SYNTHETIC DATA PIPELINE")
    print(f"Target API:        {BASE_URL}")
    print(f"Target Duration:   {duration_sec} seconds ({duration_sec / 60:.1f} minutes)")
    print(f"Status Updates:    Every {STATUS_INTERVAL_SEC} seconds (5 minutes)")
    print(f"Dataset Outputs:   synthetic_fine_tune.jsonl | failure_cases.json")
    print("=" * 80)

    start_time = time.time()
    next_status_time = start_time + STATUS_INTERVAL_SEC

    total_scenarios = 0
    passed_scenarios = 0
    failed_scenarios = 0
    fine_tune_samples = 0
    total_turns_executed = 0

    fine_tune_filepath = os.path.join(os.getcwd(), "synthetic_fine_tune.jsonl")
    failure_filepath = os.path.join(os.getcwd(), "failure_cases.json")

    # Load existing failure cases if any
    all_failures = []
    if os.path.exists(failure_filepath):
        try:
            with open(failure_filepath, "r", encoding="utf-8") as f:
                all_failures = json.load(f)
        except Exception:
            all_failures = []

    scenario_idx = 1

    try:
        while time.time() - start_time < duration_sec:
            scenario = generate_scenario(scenario_idx)
            scenario_idx += 1
            total_scenarios += 1

            session_id = f"sim_{uuid.uuid4().hex[:10]}_{int(time.time())}"
            conversation_history = []
            scenario_passed = True
            scenario_min_score = 100
            scenario_failures = []
            current_state = {}

            # Execute multi-turn conversation
            for turn in scenario["turns"]:
                user_msg = turn["msg"]
                total_turns_executed += 1

                # Dynamic delay between turns (0.2s - 0.8s)
                time.sleep(random.uniform(0.2, 0.8))

                turn_start = time.time()
                try:
                    payload = {
                        "message": user_msg,
                        "sessionId": session_id,
                        "sessionData": current_state
                    }
                    resp = requests.post(BASE_URL, json=payload, timeout=10)
                    latency_ms = int((time.time() - turn_start) * 1000)

                    if resp.status_code != 200:
                        scenario_passed = False
                        scenario_min_score = 0
                        scenario_failures.append(f"HTTP {resp.status_code}: {resp.text[:100]}")
                        break

                    data = resp.json()
                    bot_reply = data.get("reply", "")

                    # Evaluate turn
                    turn_score, turn_failures, current_state = evaluate_turn(
                        turn, data, current_state, scenario
                    )

                    if turn_score < scenario_min_score:
                        scenario_min_score = turn_score

                    if turn_failures:
                        scenario_failures.extend(turn_failures)
                        if turn_score < 90:
                            scenario_passed = False

                    conversation_history.append({
                        "user": user_msg,
                        "assistant": bot_reply,
                        "latency_ms": latency_ms,
                        "score": turn_score
                    })

                except Exception as ex:
                    scenario_passed = False
                    scenario_min_score = 0
                    scenario_failures.append(f"Exception during turn: {str(ex)}")
                    break

            # Scenario Completion Assessment
            if scenario_passed and scenario_min_score >= 90:
                passed_scenarios += 1
                fine_tune_samples += 1

                # Format in standard OpenAI / Gemini Chat JSONL format
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                for entry in conversation_history:
                    messages.append({"role": "user", "content": entry["user"]})
                    messages.append({"role": "assistant", "content": entry["assistant"]})

                fine_tune_record = {
                    "messages": messages,
                    "metadata": {
                        "scenario_id": scenario["id"],
                        "scenario_type": scenario["type"],
                        "persona": scenario["persona"],
                        "score": scenario_min_score,
                        "turns_count": len(conversation_history),
                        "timestamp": datetime.now().isoformat()
                    }
                }

                with open(fine_tune_filepath, "a", encoding="utf-8") as ft_file:
                    ft_file.write(json.dumps(fine_tune_record, ensure_ascii=False) + "\n")

            else:
                failed_scenarios += 1
                all_failures.append({
                    "scenario_id": scenario["id"],
                    "scenario_type": scenario["type"],
                    "persona": scenario["persona"],
                    "score": scenario_min_score,
                    "failures": scenario_failures,
                    "history": conversation_history,
                    "timestamp": datetime.now().isoformat()
                })

                # Write failure cases to file periodically
                with open(failure_filepath, "w", encoding="utf-8") as fail_file:
                    json.dump(all_failures, fail_file, ensure_ascii=False, indent=2)

            # Check for 5-minute status update
            now = time.time()
            if now >= next_status_time:
                elapsed_sec = int(now - start_time)
                elapsed_min = elapsed_sec // 60
                elapsed_rem_sec = elapsed_sec % 60
                pass_rate = (passed_scenarios / total_scenarios * 100) if total_scenarios > 0 else 0

                print(
                    f"⏱️ [{elapsed_min:02d}m {elapsed_rem_sec:02d}s / 45m 00s] | "
                    f"Total Scenarios: {total_scenarios} | "
                    f"Pass Rate: {pass_rate:.1f}% | "
                    f"Fine-Tune Samples: {fine_tune_samples} | "
                    f"Failures: {failed_scenarios}"
                )
                sys.stdout.flush()
                next_status_time = now + STATUS_INTERVAL_SEC

            # Output brief progress every 10 scenarios
            if total_scenarios % 10 == 0:
                elapsed_sec = int(time.time() - start_time)
                pass_rate = (passed_scenarios / total_scenarios * 100) if total_scenarios > 0 else 0
                print(
                    f"  ➔ Scenario #{total_scenarios:04d} [{scenario['type']}] - "
                    f"Score: {scenario_min_score}/100 | Pass Rate: {pass_rate:.1f}% | "
                    f"Elapsed: {elapsed_sec // 60}m {elapsed_sec % 60}s"
                )
                sys.stdout.flush()

    except KeyboardInterrupt:
        print("\n⚠️ Simulation interrupted by user.")

    # Final Execution Summary
    total_elapsed = int(time.time() - start_time)
    pass_rate = (passed_scenarios / total_scenarios * 100) if total_scenarios > 0 else 0

    print("\n" + "=" * 80)
    print("🏁 45-MINUTE SELF-PLAY SIMULATION COMPLETED")
    print("=" * 80)
    print(f"Total Elapsed Time:         {total_elapsed // 60}m {total_elapsed % 60}s")
    print(f"Total Scenarios Executed:   {total_scenarios}")
    print(f"Total Turns Evaluated:      {total_turns_executed}")
    print(f"Passed Scenarios (>=90):    {passed_scenarios} ({pass_rate:.1f}%)")
    print(f"Failed Scenarios (<90):     {failed_scenarios}")
    print(f"Fine-Tune Dataset:          {fine_tune_filepath} ({fine_tune_samples} records)")
    print(f"Failure Log:                {failure_filepath} ({len(all_failures)} logged cases)")
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Autonomous LLM Self-Play & Synthetic Data Pipeline")
    parser.add_argument("--duration", type=int, default=DEFAULT_DURATION_SEC, help="Run duration in seconds")
    args = parser.parse_args()
    run_orchestrator(duration_sec=args.duration)
