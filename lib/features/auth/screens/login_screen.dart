import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/tenant_provider.dart';
import '../../../core/theme/tenant_theme.dart';
import '../models/user_model.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({Key? key, required this.onLoginSuccess}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'reception@clinic.local');
  final _passwordController = TextEditingController(text: 'secret123');
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tenantProv = context.watch<TenantProvider>();
    final activeTenant = tenantProv.activeTenant;
    final authProv = context.watch<AuthProvider>();

    return Scaffold(
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Card(
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Tenant Switcher Bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.apartment_rounded,
                                  size: 18, color: activeTenant.primaryColor),
                              const SizedBox(width: 8),
                              const Text(
                                'العيادة النشطة:',
                                style: TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: activeTenant.id,
                              dropdownColor: activeTenant.surfaceColor,
                              style: TextStyle(
                                color: activeTenant.primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                fontFamily: 'Cairo',
                              ),
                              items: TenantConfig.presets.map((t) {
                                return DropdownMenuItem(
                                  value: t.id,
                                  child: Text(t.nameEn),
                                );
                              }).toList(),
                              onChanged: (id) {
                                if (id != null) {
                                  tenantProv.switchTenantById(id);
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),

                      // Clinic Branding Header
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                activeTenant.primaryColor,
                                activeTenant.secondaryColor,
                              ],
                            ),
                          ),
                          child: Icon(activeTenant.icon, size: 34, color: Colors.black),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        activeTenant.name,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        activeTenant.tagline,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Quick Role Selector (Doctor, Secretary, Admin)
                      const Text(
                        'تسجيل الدخول السريع حسب الصلاحية:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: UserRole.values.map((role) {
                          final isSelected = authProv.currentRole == role;
                          return ChoiceChip(
                            label: Text(role.displayNameAr),
                            selected: isSelected,
                            selectedColor: activeTenant.primaryColor,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.black : Colors.white,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              fontSize: 12,
                            ),
                            onSelected: (_) {
                              authProv.switchRole(role);
                              // Update demo inputs
                              final demoUser = UserModel.demoUsers.firstWhere(
                                (u) => u.role == role,
                              );
                              _emailController.text = demoUser.email;
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),

                      // Email Field
                      TextField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: 'البريد الإلكتروني',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Password Field
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'كلمة المرور',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Error message if any
                      if (authProv.errorMessage != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: Colors.red.withValues(alpha: 0.4),
                            ),
                          ),
                          child: Text(
                            authProv.errorMessage!,
                            style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                          ),
                        ),

                      // Submit Button
                      ElevatedButton(
                        onPressed: authProv.isLoading
                            ? null
                            : () async {
                                final success = await authProv.login(
                                  _emailController.text,
                                  _passwordController.text,
                                );
                                if (success) {
                                  widget.onLoginSuccess();
                                }
                              },
                        child: authProv.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.black,
                                ),
                              )
                            : const Text('دخول إلى لوحة التحكم'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
