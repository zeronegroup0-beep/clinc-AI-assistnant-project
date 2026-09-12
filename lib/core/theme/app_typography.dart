import 'package:flutter/material.dart';

/// Typography definitions tailored for RTL Arabic healthcare applications
class AppTypography {
  AppTypography._();

  static const String arabicFontFamily = 'Cairo';

  static TextStyle headingLarge({Color color = Colors.white}) => TextStyle(
        fontFamily: arabicFontFamily,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: color,
        height: 1.3,
      );

  static TextStyle headingMedium({Color color = Colors.white}) => TextStyle(
        fontFamily: arabicFontFamily,
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: color,
        height: 1.3,
      );

  static TextStyle headingSmall({Color color = Colors.white}) => TextStyle(
        fontFamily: arabicFontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.3,
      );

  static TextStyle bodyMedium({Color color = const Color(0xFFE2E8F0)}) => TextStyle(
        fontFamily: arabicFontFamily,
        fontSize: 14,
        fontWeight: FontWeight.normal,
        color: color,
        height: 1.5,
      );

  static TextStyle bodySmall({Color color = const Color(0xFF94A3B8)}) => TextStyle(
        fontFamily: arabicFontFamily,
        fontSize: 12,
        fontWeight: FontWeight.normal,
        color: color,
        height: 1.4,
      );

  static TextStyle caption({Color color = const Color(0xFF64748B)}) => TextStyle(
        fontFamily: arabicFontFamily,
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: color,
      );
}
