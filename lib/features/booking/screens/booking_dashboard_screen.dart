import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/tenant_provider.dart';
import '../../../core/theme/tenant_theme.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/appointment_model.dart';
import '../models/waitlist_model.dart';
import '../repositories/booking_repository.dart';
import 'appointment_calendar_view.dart';
import 'waitlist_view.dart';

/// Main SaaS Clinic Staff Dashboard with Live Multi-Tenant & Role Support
class BookingDashboardScreen extends StatefulWidget {
  final BookingRepository repository;
  final VoidCallback onLogout;

  const BookingDashboardScreen({
    Key? key,
    required this.repository,
    required this.onLogout,
  }) : super(key: key);

  @override
  State<BookingDashboardScreen> createState() => _BookingDashboardScreenState();
}

class _BookingDashboardScreenState extends State<BookingDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<AppointmentModel> _appointments = [];
  List<WaitlistModel> _waitlist = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final appointments = await widget.repository.fetchAppointments();
    final waitlist = await widget.repository.fetchWaitlist();
    if (mounted) {
      setState(() {
        _appointments = appointments;
        _waitlist = waitlist;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tenantProv = context.watch<TenantProvider>();
    final activeTenant = tenantProv.activeTenant;
    final authProv = context.watch<AuthProvider>();
    final user = authProv.currentUser;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: activeTenant.primaryColor.withValues(alpha: 0.2),
                ),
                child: Icon(activeTenant.icon,
                    size: 20, color: activeTenant.primaryColor),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activeTenant.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '${user?.name ?? "مستخدم"} (${user?.role.displayNameAr ?? ""})',
                    style: TextStyle(
                      fontSize: 11,
                      color: activeTenant.primaryColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            // Tenant Switcher dropdown
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: activeTenant.id,
                  dropdownColor: activeTenant.surfaceColor,
                  icon: Icon(Icons.palette_rounded, color: activeTenant.primaryColor),
                  items: TenantConfig.presets.map((t) {
                    return DropdownMenuItem(
                      value: t.id,
                      child: Text(
                        t.nameEn,
                        style: const TextStyle(fontSize: 12, fontFamily: 'Cairo'),
                      ),
                    );
                  }).toList(),
                  onChanged: (id) {
                    if (id != null) tenantProv.switchTenantById(id);
                  },
                ),
              ),
            ),
            // Role switcher popup
            PopupMenuButton<UserRole>(
              icon: const Icon(Icons.switch_account_rounded),
              tooltip: 'تبديل الصلاحية (تجربة العرض)',
              onSelected: (role) => authProv.switchRole(role),
              itemBuilder: (context) => UserRole.values.map((role) {
                return PopupMenuItem(
                  value: role,
                  child: Text(
                    role.displayNameAr,
                    style: TextStyle(
                      fontWeight: authProv.currentRole == role
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                );
              }).toList(),
            ),
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              tooltip: 'تحديث البيانات من السيرفر',
              onPressed: _loadData,
            ),
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'تسجيل الخروج',
              onPressed: widget.onLogout,
            ),
          ],
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: activeTenant.primaryColor,
            labelColor: activeTenant.primaryColor,
            unselectedLabelColor: Colors.white60,
            tabs: [
              Tab(
                icon: const Icon(Icons.list_alt_rounded),
                text: 'المواعيد النشطة (${_appointments.length})',
              ),
              const Tab(
                icon: Icon(Icons.calendar_month_rounded),
                text: 'التقويم الأسبوعي',
              ),
              Tab(
                icon: const Icon(Icons.hourglass_top_rounded),
                text: 'قائمة الانتظار (${_waitlist.length})',
              ),
            ],
          ),
        ),
        body: _isLoading
            ? Center(
                child: CircularProgressIndicator(color: activeTenant.primaryColor),
              )
            : TabBarView(
                controller: _tabController,
                children: [
                  // Tab 1: Active Appointments List
                  _buildAppointmentsList(activeTenant),

                  // Tab 2: Weekly Calendar
                  AppointmentCalendarView(
                    appointments: _appointments,
                    primaryColor: activeTenant.primaryColor,
                  ),

                  // Tab 3: Waitlist
                  WaitlistView(
                    waitlist: _waitlist,
                    primaryColor: activeTenant.primaryColor,
                    onRefresh: _loadData,
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildAppointmentsList(TenantConfig activeTenant) {
    if (_appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy_rounded,
                size: 64, color: Colors.white.withValues(alpha: 0.2)),
            const SizedBox(height: 16),
            const Text(
              'لا توجد مواعيد مسجلة حالياً',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'استخدم الوكيل الذكي "نورا" لحجز موعد جديد وسيظهر هنا لحظياً',
              style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5)),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _appointments.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final apt = _appointments[index];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: activeTenant.primaryColor.withValues(alpha: 0.15),
                  child: Icon(Icons.person_rounded,
                      color: activeTenant.primaryColor),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        apt.patientName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.phone_rounded,
                              size: 14, color: Colors.white.withValues(alpha: 0.6)),
                          const SizedBox(width: 4),
                          Text(
                            apt.phone,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Icon(Icons.calendar_today_rounded,
                              size: 14, color: activeTenant.primaryColor),
                          const SizedBox(width: 4),
                          Text(
                            '${apt.date} - ${apt.time}',
                            style: TextStyle(
                              fontSize: 13,
                              color: activeTenant.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      if (apt.reason != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'التخصص: ${apt.reason}',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                  ),
                  child: const Text(
                    'مؤكد',
                    style: TextStyle(
                      color: Colors.greenAccent,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
