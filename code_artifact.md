# Product Requirements Document (PRD) & Tech Context
## Project Name: Smart Clinic AI Management System
## Version: 1.0
## Target Language: Arabic (RTL)

---

### 1. نظرة عامة على المشروع (Project Overview)
نظام متكامل لإدارة العيادات يعتمد على الذكاء الاصطناعي (AI Agent). يهدف النظام إلى أتمتة حجز المواعيد، الإجابة على استفسارات المرضى عبر واجهة محادثة ذكية، وتحليل البيانات واستخراج رؤى استراتيجية (Insights) لإدارة العيادة. يركز المشروع بشكل أساسي على أمن البيانات (Data Security) وخصوصية المرضى.

### 2. الأهداف الرئيسية (Core Objectives)
- تقليل العبء الإداري على موظفي الاستقبال بنسبة 70% عبر أتمتة الحجوزات والأسئلة الشائعة.
- تقديم تجربة مستخدم (UX) ممتازة للمرضى تدعم اللغة العربية والاتجاه من اليمين لليسار (RTL).
- توفير لوحة تحكم تحليلية (Analytics Dashboard) تعتمد على الـ AI لفهم احتياجات المرضى وتحسين الخدمات.
- ضمان أقصى درجات حماية البيانات وتشفير المعلومات الشخصية (PII).

---

### 3. نطاق العمل والميزات الأساسية (Scope & Features)

#### أ. واجهة المرضى (Patient-Facing Features)
1. **الوكيل الذكي (AI Agent):**
   - قدرة الـ AI على فهم نية المستخدم (Intent Recognition).
   - **استدعاء الدوال (Function Calling):** التحقق من المواعيد المتاحة، حجز موعد، إلغاء موعد.
   - الإجابة على الأسئلة الشائعة (FAQ) استناداً إلى قاعدة معرفة العيادة (RAG).
2. **واجهة المحادثة (Chat UI):**
   - عرض خطوات تفكير الوكيل (Reasoning Steps) بشفافية (مثل: "جاري البحث عن مواعيد متاحة...").
   - دعم التحديث اللحظي (Real-time Streaming) للردود.
3. **إدارة الحسابات:**
   - تسجيل الدخول والمصادقة.
   - عزل تام لبيانات كل مريض (Data Isolation).

#### ب. واجهة الإدارة وتحليل البيانات (Admin & Analytics Features)
1. **لوحة التحكم (Dashboard):**
   - عرض الحجوزات اليومية.
2. **محرك تحليلات الذكاء الاصطناعي (AI Analytics Engine):**
   - مهمة مجدولة (Cron Job) تجمع بيانات المحادثات الأسبوعية بشكل مجهول (Anonymized).
   - استخراج تقرير يوضح: (أكثر 5 استفسارات، خدمات يطلبها المرضى غير متوفرة، توصيات للتحسين).

#### ج. متطلبات الأمان والخصوصية (Security & Privacy - CRITICAL)
1. **التشفير على مستوى الحقل (Field-Level Encryption):** تشفير بيانات المريض الحساسة (الاسم، رقم الهاتف، السجل الطبي) في قاعدة البيانات باستخدام AES-256.
2. **إخفاء الهوية (Anonymization):** تنظيف نصوص المحادثات من أي بيانات شخصية قبل إرسالها إلى الـ LLM للتحليل.
3. **التحكم في الوصول (RBAC):** صلاحيات مختلفة للمريض والمدير.

---

### 4. المهارات والتقنيات المطلوبة (Tech Stack & Skills)
لتقديم هذا المشروع للـ AI المولد للأكواد، يجب أن يلتزم بالتقنيات التالية:
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (with Mongoose) OR PostgreSQL (with Prisma).
- **AI Integration:** Anthropic (Claude API) or OpenAI API (Must use Tool Calling / Function Calling API).
- **Security:** Node.js `crypto` module (for Field-Level Encryption), `bcrypt` (for passwords), `jsonwebtoken` (JWT), `helmet`.
- **Frontend:** HTML5, CSS3/TailwindCSS, Vanilla JS or React.js.
- **UI/UX Skills:** Strict adherence to Arabic RTL design principles (using `dir="rtl"` and logical CSS properties like `margin-inline-start`).

---

### 5. مسارات المستخدم (User Flows)
1. **مسار الحجز:** المريض يفتح الشات -> يطلب ميعاد لدكتور أسنان يوم الخميس -> الـ Agent يبحث باستخدام `check_availability` -> يعرض المواعيد -> المريض يختار -> الـ Agent ينفذ `book_appointment` -> ظهور رسالة تأكيد.
2. **مسار التحليل للمدير:** النظام يجمع بيانات 7 أيام -> يزيل الأسماء والأرقام -> يرسل النصوص للـ AI -> يتلقى JSON به التحليلات -> يعرضه في لوحة الإدارة بتنسيق رسومي ومقالي.

---

### 6. تعليمات خاصة لـ AI/Anti-Gravity عند توليد الكود (AI Directives)
- ابدأ دائماً بتأسيس طبقة الأمان (Security & Middleware) قبل بناء الـ Business Logic.
- لا تقم بتوليد واجهات أمامية (Frontend) لا تدعم RTL.
- استخدم الـ Environment Variables (`.env`) لجميع المفاتيح السرية (Secret Keys).
- اكتب تعليقات توضيحية (Comments) في الكود تشرح كيفية عمل خوارزمية التشفير وفصل البيانات.