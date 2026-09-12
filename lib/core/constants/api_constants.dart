import 'package:flutter/foundation.dart';

/// API Constants for connecting with the existing Node.js backend
class ApiConstants {
  ApiConstants._();

  /// Default local development base URLs:
  /// - Web / Desktop / iOS Simulator: http://localhost:5000
  /// - Android Emulator: http://10.0.2.2:5000
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    // For native platforms default to localhost (or 10.0.2.2 on Android)
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
  }

  // Endpoints connecting to existing Node.js chatRoutes.js
  static const String chat = '/api/chat';
  static const String appointments = '/api/appointments';
  static const String waitlist = '/api/waitlist';
  static const String resetChat = '/api/chat/reset';

  // Request Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);
}
