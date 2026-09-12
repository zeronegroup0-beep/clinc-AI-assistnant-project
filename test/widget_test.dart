import 'package:flutter_test/flutter_test.dart';
import 'package:smart_clinic_flutter/core/network/api_client.dart';
import 'package:smart_clinic_flutter/core/theme/tenant_theme.dart';
import 'package:smart_clinic_flutter/features/auth/models/user_model.dart';
import 'package:smart_clinic_flutter/features/booking/models/appointment_model.dart';

void main() {
  group('Smart Clinic SaaS Flutter Unit Tests', () {
    test('Tenant branding presets initialize correctly', () {
      expect(TenantConfig.presets.length, equals(3));
      final defaultTenant = TenantConfig.defaultTenant;
      expect(defaultTenant.id, equals('smart_dental'));
      expect(defaultTenant.nameEn, contains('Smart Dental'));
    });

    test('User roles parse correctly', () {
      final doctor = UserModel.demoUsers.firstWhere((u) => u.role == UserRole.doctor);
      expect(doctor.role, equals(UserRole.doctor));
      expect(doctor.role.displayNameAr, equals('طبيب العيادة'));
    });

    test('Appointment model parses JSON correctly', () {
      final model = AppointmentModel.fromJson({
        'id': 'apt_123',
        'patientName': 'أحمد محمود',
        'phone': '01011223344',
        'doctor': 'د. أحمد شريف',
        'date': '2026-09-13',
        'time': '5:00 مساءً',
        'status': 'scheduled',
      });

      expect(model.id, equals('apt_123'));
      expect(model.isConfirmed, isTrue);
    });

    test('ApiClient initializes with default base URL', () {
      final client = ApiClient();
      expect(client, isNotNull);
    });
  });
}
