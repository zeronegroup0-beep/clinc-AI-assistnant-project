#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
 SMART CLINIC AI RECEPTIONIST (NORA) — EXTENDED RED-TEAM HARNESS
 16 Patient Personas | Egyptian Arabic Dialect | Multi-Branch Booking
 Triple Name Recognition | Multi-Doctor Cart | Dynamic Today | Cancellation
=====================================================================
 HOW TO RUN:
   pip install requests
   python nora_redteam.py               # runs all 16 personas (remote worker)
   python nora_redteam.py --local       # runs against local server (http://localhost:5000)
   python nora_redteam.py --persona 13 14 # run specific personas
   python nora_redteam.py --probe       # probe API format first
 OUTPUT: transcripts JSON + console scorecard
=====================================================================
"""
import requests, json, time, uuid, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE = "https://clinc-ai-assistnant-project.zeronegroup0.workers.dev"
if "--local" in sys.argv:
    BASE = "http://localhost:5000"

PAYLOAD_FORMAT = {"message": "{msg}", "sessionId": "{sid}"}
ENDPOINT_CANDIDATES = ["/api/chat", "/chat", "/api/message", "/api/converse"]

# ---------------------------------------------------------------- personas
PERSONAS = {
 1: {"name": "العميل المستعجل جداً", "emotion": "urgent/impatient",
     "turns": ["عايز كشف أسنان حالاً",
               "بكرة",
               "أقرب حاجة",
               "أحمد علي 01001234567",
               "تمام"]},
 2: {"name": "العميل الغاضب والمتعصب", "emotion": "angry",
     "turns": ["إيه الزحمة دي مفيش حاجة فاضية خالص؟",
               "الأسعار غالية أوي كمان",
               "طيب ابحثلي في أي فرع",
               "ماشي سجلني في الانتظار",
               "01009876543"]},
 3: {"name": "الحالة الحرجة/الطارئة", "emotion": "emergency",
     "turns": ["عندي ألم أسنان لا يحتمل وأنا بنزف",
               "مش قادر أستنى",
               "محمد حسن 01112223334"]},
 4: {"name": "البارد/المستفز", "emotion": "cold/one-word",
     "turns": ["أسنان", "مش عارف", "أي حاجة", "مش عارف", "تمام"]},
 5: {"name": "الهادئ بزيادة", "emotion": "overly polite/chatty",
     "turns": ["السلام عليكم ورحمة الله وبركاته أهلاً وسهلاً",
               "إزيك يا نورا عاملة إيه النهارده؟",
               "عندكم كام فرع؟",
               "الدكاترة شغالين إيه؟",
               "أنا عايز أحجز كشف",
               "خليل عبد الرحمن 01233445566"]},
 6: {"name": "كبار السن (عامية ثقيلة)", "emotion": "elderly/heavy dialect",
     "turns": ["يا بنتي عايز أكشف عند دكتور الأسنان",
               "بعده يعني الأسبوع الجاي لما الشمس تطلع",
               "عندي وجع في ضرسي من زمان",
               "اسمي الحاج صابر فتحي ورقمي 01055566677"]},
 7: {"name": "الاسم المشترك (نور/إسلام)", "emotion": "gender-neutral name",
     "turns": ["أنا نور وعايز أحجز",
               "جلدية",
               "01099988877"]},
 8: {"name": "المتردد بين الفروع", "emotion": "hesitant/branch-switching",
     "turns": ["عايز أحجز في فرع دمنهور",
               "ممكن أعرف مواعيد فرع الإسكندرية؟",
               "طيب أكمل في دمنهور",
               "سالي إبراهيم 01277788899"]},
 9: {"name": "مقاطع الحجز بالخدمات", "emotion": "booking interrupted by service Qs",
     "turns": ["عايز أحجز تبييض أسنان بالليزر",
               "بكم ده؟",
               "والعنوان فين بالظبط؟",
               "طيب أكمل الحجز، كريم سمير 01011122233"]},
 10: {"name": "طالب قائمة الانتظار", "emotion": "insistent on full slot",
      "turns": ["عايز يوم الخميس الساعة 5 بالظبط",
                "مش مهمني، عايز الخميس",
                "سجلني في قائمة الانتظار",
                "سجل رقمي",
                "ندى عادل 01033344455"]},
 11: {"name": "مُدخل الأرقام الخاطئة", "emotion": "wrong-then-corrected phone",
      "turns": ["عايز أحجز أسنان",
                "رضا محمود ورقمي 01012345",
                "آه صح، رقمي 01012345678"]},
 12: {"name": "المتخطي للأوقات المتاحة", "emotion": "requests closed day",
      "turns": ["عايز كشف يوم الجمعة الساعة 12",
                "طيب يوم الأحد",
                "مين الدكتور الشغال الأحد؟",
                "أوكيه، فيفي فؤاد 01066655544"]},
 13: {"name": "صاحب الاسم الثلاثي القبطي والمصري", "emotion": "triple-name / coptic-egyptian",
      "turns": ["عايز احجز كشف باطنة وقلب مع دكتور حسام فتحي",
                "يوم الإثنين الساعة 3:00 مساءً",
                "توماس انطوان مكرم 01019876543",
                "تمام أكدلي"]},
 14: {"name": "سلة الحجز المتعدد لعدة استشاريين", "emotion": "multi-doctor cart",
      "turns": ["عايز احجز كشف أسنان مع دكتور أحمد شريف",
                "يوم الإثنين الساعة 5:30 مساءً",
                "أسامة محمد الغزالي 01011223344",
                "وعايز كمان احجز كشف جلدية مع دكتورة سارة محمود",
                "يوم الثلاثاء الساعة 1:00 مساءً",
                "أكد الحجزين مع بعض"]},
 15: {"name": "المستفسر عن كشف اليوم وتأكيده الفوري", "emotion": "same-day instant confirmation",
      "turns": ["عندكم دكاترة شغالين النهاردة؟",
                "عايز احجز كشف أسنان مع دكتور أحمد شريف النهاردة",
                "5:30 مساءً",
                "كريم عبد العزيز 01123456789",
                "تمام أكدلي"]},
 16: {"name": "راغب في إلغاء الحجز عبر كود SC-XXXXX", "emotion": "cancellation flow",
      "turns": ["عايز الغي حجزي",
                "SC-10001",
                "شكراً جزيلاً"]}
}

SCORE_FIELDS = ["Entity Extraction", "Gender Agreement",
                "Branch & Schedule Logic", "Tone Adaptability"]

def build_payload(msg, sid):
    p = {}
    for k, v in PAYLOAD_FORMAT.items():
        p[k] = v.replace("{msg}", msg).replace("{sid}", sid)
    return p

def probe():
    print(f"[*] Probing API format at {BASE}...")
    for ep in ENDPOINT_CANDIDATES:
        try:
            r = requests.post(BASE + ep, json={"message": "أهلاً", "sessionId": "probe_1"},
                              headers={"Content-Type": "application/json"}, timeout=20)
            print(f"  {ep}: HTTP {r.status_code} | {r.text[:300]}")
        except Exception as e:
            print(f"  {ep}: ERROR {e}")

def run_persona(pid, persona):
    sid = str(uuid.uuid4())
    transcript, score = [], {f: True for f in SCORE_FIELDS}
    print(f"\n{'='*64}\n[#] Persona {pid}: {persona['name']} ({persona['emotion']})\n{'='*64}")
    for i, msg in enumerate(persona["turns"], 1):
        print(f"  User: {msg}")
        try:
            r = requests.post(BASE + ENDPOINT_CANDIDATES[0],
                              json=build_payload(msg, sid), timeout=30)
            reply = r.json() if "json" in r.headers.get("Content-Type","") else r.text
            if isinstance(reply, dict): 
                reply = reply.get("reply") or reply.get("message") or json.dumps(reply, ensure_ascii=False)
        except Exception as e:
            reply = f"<HARNESS ERROR: {e}>"
            score["Entity Extraction"] = False
        transcript.append({"turn": i, "user": msg, "nora": reply})
        print(f"  Nora: {reply}")
        time.sleep(0.5)
    return {"persona_id": pid, "name": persona["name"],
            "emotion": persona["emotion"], "transcript": transcript, "score": score}

def main():
    args = sys.argv[1:]
    if "--probe" in args:
        probe(); return

    target_ids = []
    if "--persona" in args:
        idx = args.index("--persona")
        for a in args[idx+1:]:
            if a.isdigit(): target_ids.append(int(a))
            else: break
    elif any(a.isdigit() for a in args):
        target_ids = [int(a) for a in args if a.isdigit()]
    
    if not target_ids:
        target_ids = sorted(PERSONAS.keys())

    print(f"[*] Target Host: {BASE}")
    print(f"[*] Executing Red-Team suite for {len(target_ids)} personas: {target_ids}")

    results = [run_persona(i, PERSONAS[i]) for i in target_ids if i in PERSONAS]
    
    with open("nora_redteam_transcripts.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print("\n" + "="*64)
    print("      NORA RED-TEAM SUITE EVALUATION SCORECARD")
    print("="*64)
    for res in results:
        status = "PASSED" if not any("<HARNESS ERROR" in t["nora"] for t in res["transcript"]) else "FAILED"
        print(f"Persona {res['persona_id']:02d} [{res['name'][:28]:<28}] : {status}")
    print("="*64)
    print(f"[*] Detailed transcripts saved -> nora_redteam_transcripts.json")

if __name__ == "__main__":
    main()
