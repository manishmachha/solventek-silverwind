import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';
import 'widgets/stat_card.dart';

class EmployeeDashboard extends ConsumerStatefulWidget {
  const EmployeeDashboard({super.key});
  @override
  ConsumerState<EmployeeDashboard> createState() => _EmployeeDashboardState();
}

class _EmployeeDashboardState extends ConsumerState<EmployeeDashboard> {
  bool _checkedIn = false;
  int _leaveBalance = 0, _projectCount = 0, _openTickets = 0;
  List<Map<String, dynamic>> _upcomingHolidays = [];
  List<Map<String, dynamic>> _recentActivities = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiServiceProvider);
      final ticketService = TicketService(api);
      final holidayService = HolidayService(api);
      final projectService = ProjectService(api);
      final leaveService = LeaveService(api);
      final attendanceService = AttendanceService(api);
      final notifService = NotificationService(api);

      final results = await Future.wait([
        attendanceService.getMyAttendance().catchError((_) => {}),
        leaveService.getMyLeaves().catchError((_) => []),
        projectService.getProjects().catchError((_) => []),
        ticketService.getMyTickets().catchError((_) => []),
        holidayService.getHolidays().catchError((_) => []),
        notifService.getNotifications().catchError((_) => []),
      ]);

      if (!mounted) return;

      // Leave balance
      final leaves = results[1];
      if (leaves is List) {
        _leaveBalance = leaves.length;
      }

      // Projects
      final projects = results[2];
      if (projects is List) _projectCount = projects.length;

      // Tickets
      final tickets = results[3];
      if (tickets is List) {
        _openTickets = tickets
            .where((t) => t['status'] != 'CLOSED' && t['status'] != 'RESOLVED')
            .length;
      }

      // Holidays
      final holidays = results[4];
      if (holidays is List) {
        final now = DateTime.now();
        _upcomingHolidays = holidays
            .where((h) {
              final d = DateTime.tryParse(h['date'] ?? '');
              return d != null && d.isAfter(now);
            })
            .take(3)
            .map((h) {
              final d = DateTime.parse(h['date']);
              return {
                'day': d.day.toString(),
                'month': _monthStr(d.month),
                'name': h['name'] ?? '',
                'dayOfWeek': _dayOfWeek(d.weekday),
              };
            })
            .toList();
      }

      // Notifications as recent activity
      final notifs = results[5];
      if (notifs is List) {
        _recentActivities = notifs
            .take(5)
            .map(
              (n) => {
                'title': n['title'] ?? n['message'] ?? '',
                'time': n['createdAt'] ?? '',
              },
            )
            .toList();
      }

      setState(() {});
    } catch (_) {
      if (mounted) setState(() {});
    }
  }

  String _monthStr(int m) => const [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][m];
  String _dayOfWeek(int d) => const [
    '',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ][d];

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.firstName ?? '';

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats
          _buildStats(),
          const SizedBox(height: 20),
          // Quick Actions
          _buildQuickActionsSection(),
          const SizedBox(height: 20),
          // Upcoming Holidays
          if (_upcomingHolidays.isNotEmpty) ...[
            _buildHolidaysSection(),
            const SizedBox(height: 20),
          ],
          // Recent Activity
          if (_recentActivities.isNotEmpty) _buildActivitySection(),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        StatCard(
          label: "Today's Status",
          value: _checkedIn ? 'Checked In' : 'Not Checked In',
          icon: _checkedIn ? Icons.check_circle : Icons.schedule,
          gradient: _checkedIn
              ? const [Color(0xFF10B981), Color(0xFF059669)]
              : const [Color(0xFFF59E0B), Color(0xFFD97706)],
          subtitle: _checkedIn ? 'Since 9:15 AM' : 'Tap to check in',
        ),
        StatCard(
          label: 'Leave Balance',
          value: '$_leaveBalance',
          subtitle: 'days remaining',
          icon: Icons.calendar_today,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          onTap: () => context.go('/my-leaves'),
        ),
        StatCard(
          label: 'My Projects',
          value: '$_projectCount',
          subtitle: 'active assignments',
          icon: Icons.view_kanban,
          gradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          onTap: () => context.go('/projects'),
        ),
        StatCard(
          label: 'My Tickets',
          value: '$_openTickets',
          subtitle: 'open tickets',
          icon: Icons.confirmation_number,
          gradient: const [Color(0xFFF97316), Color(0xFFEA580C)],
          onTap: () => context.go('/portal/tickets'),
        ),
      ],
    );
  }

  Widget _buildQuickActionsSection() {
    final actions = [
      {
        'title': 'My Attendance',
        'sub': 'View attendance records',
        'icon': Icons.calendar_today,
        'g': [const Color(0xFF10B981), const Color(0xFF059669)],
        'bg': const Color(0xFFF0FDF4),
        'route': '/my-attendance',
      },
      {
        'title': 'Apply Leave',
        'sub': 'Request time off',
        'icon': Icons.calendar_month,
        'g': [const Color(0xFF3B82F6), const Color(0xFF2563EB)],
        'bg': const Color(0xFFEFF6FF),
        'route': '/my-leaves',
      },
      {
        'title': 'My Payslips',
        'sub': 'View salary slips',
        'icon': Icons.receipt_long,
        'g': [const Color(0xFFA855F7), const Color(0xFF9333EA)],
        'bg': const Color(0xFFFAF5FF),
        'route': '/my-payslips',
      },
      {
        'title': 'My Assets',
        'sub': 'Assigned equipment',
        'icon': Icons.laptop,
        'g': [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
        'bg': const Color(0xFFEEF2FF),
        'route': '/my-assets',
      },
      {
        'title': 'Raise Ticket',
        'sub': 'Submit a request',
        'icon': Icons.confirmation_number,
        'g': [const Color(0xFFF97316), const Color(0xFFEA580C)],
        'bg': const Color(0xFFFFF7ED),
        'route': '/portal/tickets',
      },
      {
        'title': 'My Profile',
        'sub': 'View & edit profile',
        'icon': Icons.person,
        'g': [const Color(0xFFEC4899), const Color(0xFFDB2777)],
        'bg': const Color(0xFFFDF2F8),
        'route': '/profile',
      },
      {
        'title': 'Organization',
        'sub': 'Company directory',
        'icon': Icons.business,
        'g': [const Color(0xFF14B8A6), const Color(0xFF0D9488)],
        'bg': const Color(0xFFF0FDFA),
        'route': '/organization/my-organization',
      },
      {
        'title': 'Holidays',
        'sub': 'View holiday list',
        'icon': Icons.event,
        'g': [const Color(0xFFF59E0B), const Color(0xFFD97706)],
        'bg': const Color(0xFFFFFBEB),
        'route': '/holidays',
      },
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.flash_on,
                  size: 16,
                  color: Color(0xFF6366F1),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Quick Actions',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: Color(0xFF374151),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.6,
            ),
            itemCount: actions.length,
            itemBuilder: (_, i) {
              final a = actions[i];
              return QuickActionCard(
                title: a['title'] as String,
                subtitle: a['sub'] as String,
                icon: a['icon'] as IconData,
                iconGradient: a['g'] as List<Color>,
                cardBg: a['bg'] as Color,
                onTap: () => context.go(a['route'] as String),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildHolidaysSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.event,
                  size: 16,
                  color: Color(0xFFD97706),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Upcoming Holidays',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: Color(0xFF374151),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._upcomingHolidays.map(
            (h) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFFBEB), Color(0xFFFFF7ED)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Column(
                    children: [
                      Text(
                        h['day']!,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFD97706),
                        ),
                      ),
                      Text(
                        h['month']!,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFB45309),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        h['name']!,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      Text(
                        h['dayOfWeek']!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          GestureDetector(
            onTap: () => context.go('/holidays'),
            child: const Row(
              children: [
                Text(
                  'View All Holidays',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF6366F1),
                  ),
                ),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward, size: 14, color: Color(0xFF6366F1)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivitySection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.history,
                  size: 16,
                  color: Color(0xFF6366F1),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Recent Activity',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: Color(0xFF374151),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._recentActivities.map(
            (a) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.history,
                      size: 14,
                      color: Color(0xFF6366F1),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          a['title'] ?? '',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        Text(
                          a['time'] ?? '',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
