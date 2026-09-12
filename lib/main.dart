import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'core/constants/app_constants.dart';
import 'core/network/api_client.dart';
import 'core/theme/tenant_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/booking/repositories/booking_repository.dart';
import 'features/booking/screens/booking_dashboard_screen.dart';
import 'features/chat_agent/services/chat_agent_service.dart';
import 'features/chat_agent/widgets/floating_chat_widget.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize core singletons
  final apiClient = ApiClient();
  final bookingRepo = BookingRepository(apiClient: apiClient);
  final chatService = ChatAgentService(apiClient: apiClient);

  runApp(
    SmartClinicApp(
      apiClient: apiClient,
      bookingRepo: bookingRepo,
      chatService: chatService,
    ),
  );
}

class SmartClinicApp extends StatelessWidget {
  final ApiClient apiClient;
  final BookingRepository bookingRepo;
  final ChatAgentService chatService;

  const SmartClinicApp({
    Key? key,
    required this.apiClient,
    required this.bookingRepo,
    required this.chatService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => TenantProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(apiClient: apiClient),
        ),
      ],
      child: Consumer<TenantProvider>(
        builder: (context, tenantProv, _) {
          final activeTenant = tenantProv.activeTenant;

          return MaterialApp(
            title: '${activeTenant.name} - ${AppConstants.appName}',
            debugShowCheckedModeBanner: false,
            theme: activeTenant.toThemeData(),
            locale: const Locale('ar', 'EG'),
            supportedLocales: const [
              Locale('ar', 'EG'),
              Locale('en', 'US'),
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: AppRootScaffold(
              bookingRepo: bookingRepo,
              chatService: chatService,
            ),
          );
        },
      ),
    );
  }
}

/// Root scaffold holding main content and the persistent Floating Chat Agent overlay
class AppRootScaffold extends StatefulWidget {
  final BookingRepository bookingRepo;
  final ChatAgentService chatService;

  const AppRootScaffold({
    Key? key,
    required this.bookingRepo,
    required this.chatService,
  }) : super(key: key);

  @override
  State<AppRootScaffold> createState() => _AppRootScaffoldState();
}

class _AppRootScaffoldState extends State<AppRootScaffold> {
  bool _isLoggedIn = true;

  @override
  Widget build(BuildContext context) {
    final authProv = context.watch<AuthProvider>();
    final isAuthenticated = authProv.isAuthenticated && _isLoggedIn;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Stack(
          children: [
            // Main content based on authentication
            if (!isAuthenticated)
              LoginScreen(
                onLoginSuccess: () => setState(() => _isLoggedIn = true),
              )
            else
              BookingDashboardScreen(
                repository: widget.bookingRepo,
                onLogout: () {
                  authProv.logout();
                  setState(() => _isLoggedIn = false);
                },
              ),

            // Persistent Floating AI Receptionist (Noura) Overlay
            FloatingChatAgentWidget(
              chatService: widget.chatService,
            ),
          ],
        ),
      ),
    );
  }
}
