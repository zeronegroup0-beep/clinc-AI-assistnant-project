/// SaaS User Roles for role-based access control
enum UserRole {
  doctor,
  secretary,
  admin,
}

extension UserRoleExtension on UserRole {
  String get displayNameAr {
    switch (this) {
      case UserRole.doctor:
        return 'طبيب العيادة';
      case UserRole.secretary:
        return 'موظف الاستقبال والسكرتارية';
      case UserRole.admin:
        return 'مدير النظام والعيادة';
    }
  }

  String get id {
    switch (this) {
      case UserRole.doctor:
        return 'doctor';
      case UserRole.secretary:
        return 'secretary';
      case UserRole.admin:
        return 'admin';
    }
  }
}

/// User Model representing authenticated clinic staff member
class UserModel {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? specialty;
  final String? token;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.specialty,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? 'user_default',
      name: json['name'] as String? ?? 'مستخدم',
      email: json['email'] as String? ?? '',
      role: _parseRole(json['role'] as String?),
      specialty: json['specialty'] as String?,
      token: json['token'] as String?,
    );
  }

  static UserRole _parseRole(String? roleStr) {
    switch (roleStr?.toLowerCase()) {
      case 'doctor':
        return UserRole.doctor;
      case 'secretary':
      case 'receptionist':
        return UserRole.secretary;
      case 'admin':
      default:
        return UserRole.admin;
    }
  }

  /// Preset demo users for role previewing
  static const List<UserModel> demoUsers = [
    UserModel(
      id: 'doc_1',
      name: 'د. أحمد شريف',
      email: 'dr.ahmed@clinic.local',
      role: UserRole.doctor,
      specialty: 'استشاري طب وجراحة الأسنان',
      token: 'demo_doctor_token_123',
    ),
    UserModel(
      id: 'sec_1',
      name: 'أ/ منى عبد الرحمن',
      email: 'reception@clinic.local',
      role: UserRole.secretary,
      specialty: 'مسؤولة الاستقبال والمواعيد',
      token: 'demo_secretary_token_456',
    ),
    UserModel(
      id: 'adm_1',
      name: 'د. كريم الإداري',
      email: 'admin@clinic.local',
      role: UserRole.admin,
      specialty: 'الإدارة العامة والتراخيص',
      token: 'demo_admin_token_789',
    ),
  ];
}
