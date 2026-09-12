import 'package:flutter/material.dart';
import '../network/api_client.dart';
import 'tenant_theme.dart';

/// Provider managing active SaaS Tenant branding & live white-labeling updates
class TenantProvider extends ChangeNotifier {
  TenantConfig _activeTenant = TenantConfig.defaultTenant;
  final ApiClient _apiClient;

  TenantProvider({required ApiClient apiClient}) : _apiClient = apiClient {
    _apiClient.setTenantId(_activeTenant.id);
  }

  TenantConfig get activeTenant => _activeTenant;
  List<TenantConfig> get availableTenants => TenantConfig.presets;

  /// Switch the active clinic tenant dynamically
  void switchTenant(TenantConfig newTenant) {
    if (_activeTenant.id == newTenant.id) return;
    _activeTenant = newTenant;
    _apiClient.setTenantId(newTenant.id);
    notifyListeners();
  }

  /// Switch tenant by ID
  void switchTenantById(String tenantId) {
    final match = TenantConfig.presets.firstWhere(
      (t) => t.id == tenantId,
      orElse: () => TenantConfig.defaultTenant,
    );
    switchTenant(match);
  }
}
