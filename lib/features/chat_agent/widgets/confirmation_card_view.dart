import 'package:flutter/material.dart';

/// Interactive UI Card for confirmed bookings or waitlist entries
class ConfirmationCardView extends StatelessWidget {
  final Map<String, dynamic> card;
  final Color primaryColor;

  const ConfirmationCardView({
    Key? key,
    required this.card,
    required this.primaryColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final type = card['type']?.toString();
    final isBooking = type == 'booking_confirmed';

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isBooking
            ? const Color(0xFF0D2818)
            : const Color(0xFF2A1B0E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isBooking
              ? Colors.green.withValues(alpha: 0.5)
              : Colors.amber.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isBooking ? Icons.check_circle_rounded : Icons.hourglass_top_rounded,
                size: 18,
                color: isBooking ? Colors.greenAccent : Colors.amberAccent,
              ),
              const SizedBox(width: 8),
              Text(
                isBooking ? 'تأكيد حجز الموعد' : 'إضافة لقائمة الانتظار',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isBooking ? Colors.greenAccent : Colors.amberAccent,
                  fontFamily: 'Cairo',
                ),
              ),
              const Spacer(),
              if (card['bookingId'] != null)
                Text(
                  '#${card['bookingId']}',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
            ],
          ),
          const Divider(height: 16),
          _buildInfoRow(
            Icons.person_rounded,
            'اسم المريض',
            card['patientName']?.toString() ?? 'المريض',
          ),
          if (card['doctor'] != null)
            _buildInfoRow(
              Icons.medical_services_rounded,
              'الطبيب',
              card['doctor']?.toString() ?? '',
            ),
          _buildInfoRow(
            Icons.calendar_today_rounded,
            'الموعد',
            '${card['date'] ?? card['requestedDate'] ?? ''} - ${card['time'] ?? card['requestedTime'] ?? ''}',
          ),
          if (card['phone'] != null)
            _buildInfoRow(
              Icons.phone_rounded,
              'رقم الواتساب',
              card['phone']?.toString() ?? '',
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 12, color: Colors.white60),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.6),
              fontFamily: 'Cairo',
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}
