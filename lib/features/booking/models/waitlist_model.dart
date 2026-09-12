/// Model representing a waitlist entry fetched from Node.js backend
class WaitlistModel {
  final String id;
  final String patientName;
  final String phone;
  final String doctor;
  final String requestedDate;
  final String requestedTime;
  final String status;
  final String? notes;
  final DateTime? createdAt;

  const WaitlistModel({
    required this.id,
    required this.patientName,
    required this.phone,
    required this.doctor,
    required this.requestedDate,
    required this.requestedTime,
    required this.status,
    this.notes,
    this.createdAt,
  });

  factory WaitlistModel.fromJson(Map<String, dynamic> json) {
    return WaitlistModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      patientName: json['patientName'] as String? ?? 'مريض بالانتظار',
      phone: json['phone'] as String? ?? '',
      doctor: json['doctor'] as String? ?? 'د. أحمد شريف',
      requestedDate: json['requestedDate'] as String? ?? 'يوم الإثنين',
      requestedTime: json['requestedTime'] as String? ?? '4:30 مساءً',
      status: json['status'] as String? ?? 'waiting',
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}
