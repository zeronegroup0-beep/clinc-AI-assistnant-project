/// General Application and Multi-Tenant SaaS Constants
class AppConstants {
  AppConstants._();

  static const String appName = 'Smart Clinic AI';
  static const String appVersion = '1.0.0 (Flutter SaaS)';

  // Storage & Session Keys
  static const String storageSessionKey = 'smart_clinic_session_id';
  static const String storageTenantKey = 'smart_clinic_active_tenant';
  static const String storageUserKey = 'smart_clinic_logged_user';

  // Egyptian AI Receptionist Info
  static const String agentName = 'نورا';
  static const String agentRole = 'الاستقبال الذكي';
  static const String agentGreeting = 'أهلاً بحضرتك في سمارت كلينك! إزاي أقدر أساعدك النهاردة؟';
}
