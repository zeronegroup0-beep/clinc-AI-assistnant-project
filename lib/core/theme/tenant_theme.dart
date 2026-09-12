import 'package:flutter/material.dart';

/// Configuration schema for multi-tenant SaaS dynamic branding & white-labeling
class TenantConfig {
  final String id;
  final String name;
  final String nameEn;
  final String tagline;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final Color backgroundColor;
  final Color surfaceColor;
  final IconData icon;
  final List<String> specialties;
  final bool isDark;

  const TenantConfig({
    required this.id,
    required this.name,
    required this.nameEn,
    required this.tagline,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.backgroundColor,
    required this.surfaceColor,
    required this.icon,
    required this.specialties,
    this.isDark = true,
  });

  /// Pre-configured SaaS white-label tenants
  static const List<TenantConfig> presets = [
    TenantConfig(
      id: 'smart_dental',
      name: 'عيادات سمارت دينتال لطب الأسنان',
      nameEn: 'Smart Dental Clinic',
      tagline: 'أحدث تقنيات زراعة وتجميل الأسنان برعاية نخبة من الاستشاريين',
      primaryColor: Color(0xFF00BFA5), // Medical Teal
      secondaryColor: Color(0xFF00ACC1), // Cyan
      accentColor: Color(0xFF64FFDA),
      backgroundColor: Color(0xFF0B141B),
      surfaceColor: Color(0xFF14222E),
      icon: Icons.medical_services_rounded,
      specialties: ['طب وجراحة الأسنان', 'زراعة الأسنان', 'تقويم الأسنان'],
      isDark: true,
    ),
    TenantConfig(
      id: 'alamal_derma',
      name: 'مجمع الأمل للجلدية والليزر والتجميل',
      nameEn: 'Al-Amal Derma & Laser Center',
      tagline: 'عناية متكاملة بجمال ونضارة بشرتك بأحدث أجهزة الليزر العالمية',
      primaryColor: Color(0xFFAB47BC), // Royal Orchid / Violet
      secondaryColor: Color(0xFFEC407A), // Rose
      accentColor: Color(0xFFF48FB1),
      backgroundColor: Color(0xFF160D1E),
      surfaceColor: Color(0xFF241432),
      icon: Icons.auto_awesome_rounded,
      specialties: ['علاج الأمراض الجلدية', 'الليزر والتجميل', 'العناية بالبشرة'],
      isDark: true,
    ),
    TenantConfig(
      id: 'cairo_cardio',
      name: 'مركز القاهرة لأمراض الباطنة والقلب',
      nameEn: 'Cairo Cardiology & Internal Center',
      tagline: 'فحوصات قلبية وشرايين دقيقة مع أحدث برامج الرعاية الوقائية',
      primaryColor: Color(0xFF1E88E5), // Sapphire Blue
      secondaryColor: Color(0xFF00897B), // Emerald
      accentColor: Color(0xFF80D8FF),
      backgroundColor: Color(0xFF0A1220),
      surfaceColor: Color(0xFF131F33),
      icon: Icons.favorite_rounded,
      specialties: ['أمراض القلب والقسطرة', 'الباطنة العامة والسكر', 'فحوصات ضغط الدم'],
      isDark: true,
    ),
  ];

  static TenantConfig get defaultTenant => presets.first;

  /// Generate a complete Flutter Material 3 ThemeData from this tenant profile
  ThemeData toThemeData() {
    final colorScheme = ColorScheme(
      brightness: isDark ? Brightness.dark : Brightness.light,
      primary: primaryColor,
      onPrimary: Colors.black,
      secondary: secondaryColor,
      onSecondary: Colors.white,
      surface: surfaceColor,
      onSurface: Colors.white,
      error: const Color(0xFFEF4444),
      onError: Colors.white,
      tertiary: accentColor,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: isDark ? Brightness.dark : Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: backgroundColor,
      fontFamily: 'Cairo',
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceColor,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: primaryColor.withValues(alpha: 0.18),
            width: 1,
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.black,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.bold,
            fontSize: 15,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor.withValues(alpha: 0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
      ),
    );
  }
}
