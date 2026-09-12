import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../models/user_model.dart';

/// Provider handling SaaS role authentication state
class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider({required ApiClient apiClient}) : _apiClient = apiClient {
    // Default to Secretary demo login for instant convenience
    _currentUser = UserModel.demoUsers[1];
    _apiClient.setAuthToken(_currentUser?.token);
  }

  UserModel? get currentUser => _currentUser;
  UserRole get currentRole => _currentUser?.role ?? UserRole.secretary;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Quick switch role for testing different SaaS permission views
  void switchRole(UserRole role) {
    final match = UserModel.demoUsers.firstWhere(
      (u) => u.role == role,
      orElse: () => UserModel.demoUsers.first,
    );
    _currentUser = match;
    _apiClient.setAuthToken(match.token);
    notifyListeners();
  }

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Simulate authentication check or match demo users
      await Future.delayed(const Duration(milliseconds: 600));

      final match = UserModel.demoUsers.firstWhere(
        (u) => u.email.toLowerCase() == email.trim().toLowerCase(),
        orElse: () => UserModel(
          id: 'user_${DateTime.now().millisecondsSinceEpoch}',
          name: email.split('@').first,
          email: email,
          role: UserRole.doctor,
          token: 'token_${DateTime.now().millisecondsSinceEpoch}',
        ),
      );

      _currentUser = match;
      _apiClient.setAuthToken(match.token);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'فشل تسجيل الدخول، يرجى التحقق من البيانات';
      notifyListeners();
      return false;
    }
  }

  /// Logout
  void logout() {
    _currentUser = null;
    _apiClient.setAuthToken(null);
    notifyListeners();
  }
}
