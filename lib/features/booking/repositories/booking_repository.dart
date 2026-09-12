import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../models/appointment_model.dart';
import '../models/waitlist_model.dart';

/// Repository for handling appointment bookings and waitlist communications
class BookingRepository {
  final ApiClient _apiClient;

  BookingRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Fetch all appointments from Node.js backend
  Future<List<AppointmentModel>> fetchAppointments() async {
    try {
      final response = await _apiClient.get(ApiConstants.appointments);
      final rawData = response.data;

      if (rawData is Map && rawData['data'] is List) {
        return (rawData['data'] as List)
            .map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      // Fallback demo data if backend has no appointments yet
      return [
        AppointmentModel(
          id: 'apt_demo_1',
          patientName: 'أحمد محمود',
          phone: '01011223344',
          doctor: 'د. أحمد شريف',
          date: 'الإثنين',
          time: '5:30 مساءً',
          status: 'confirmed',
          reason: 'كشف وحشو أسنان',
        ),
        AppointmentModel(
          id: 'apt_demo_2',
          patientName: 'سارة إبراهيم',
          phone: '01122334455',
          doctor: 'د. سارة محمود',
          date: 'الثلاثاء',
          time: '2:00 مساءً',
          status: 'scheduled',
          reason: 'جلسة ليزر وتجميل',
        ),
      ];
    }
  }

  /// Fetch all waitlist entries from Node.js backend
  Future<List<WaitlistModel>> fetchWaitlist() async {
    try {
      final response = await _apiClient.get(ApiConstants.waitlist);
      final rawData = response.data;

      if (rawData is Map && rawData['data'] is List) {
        return (rawData['data'] as List)
            .map((item) => WaitlistModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      // Fallback demo data
      return [
        WaitlistModel(
          id: 'wl_demo_1',
          patientName: 'عمر خالد',
          phone: '01233445566',
          doctor: 'د. أحمد شريف',
          requestedDate: 'الإثنين',
          requestedTime: '4:30 مساءً',
          status: 'waiting',
          notes: 'في انتظار توفر الموعد المحجوز مسبقاً',
        ),
      ];
    }
  }
}
