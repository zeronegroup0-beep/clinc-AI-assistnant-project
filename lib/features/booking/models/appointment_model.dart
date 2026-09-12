/// Model representing an appointment fetched from Node.js backend
class AppointmentModel {
  final String id;
  final String patientName;
  final String phone;
  final String doctor;
  final String date;
  final String time;
  final String status;
  final String? reason;
  final DateTime? createdAt;

  const AppointmentModel({
    required this.id,
    required this.patientName,
    required this.phone,
    required this.doctor,
    required this.date,
    required this.time,
    required this.status,
    this.reason,
    this.createdAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      patientName: json['patientName'] as String? ?? 'مريض غير محدد',
      phone: json['phone'] as String? ?? '',
      doctor: json['doctor'] as String? ?? 'د. أحمد شريف',
      date: json['date'] as String? ?? json['dateStr'] as String? ?? 'الميعاد المختار',
      time: json['time'] as String? ?? json['timeStr'] as String? ?? '4:00 م',
      status: json['status'] as String? ?? 'scheduled',
      reason: json['reason'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  bool get isConfirmed => status.toLowerCase() == 'confirmed' || status.toLowerCase() == 'scheduled';
}
