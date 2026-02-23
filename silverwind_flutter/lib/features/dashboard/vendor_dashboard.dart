import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';
import 'widgets/stat_card.dart';

class VendorDashboard extends ConsumerStatefulWidget {
  const VendorDashboard({super.key});
  @override
  ConsumerState<VendorDashboard> createState() => _VendorDashboardState();
}

class _VendorDashboardState extends ConsumerState<VendorDashboard> {
  bool _loading = true;
  int _activeJobs = 0, _candidates = 0, _submitted = 0, _shortlisted = 0;
  List<Map<String, dynamic>> _recentApps = [];
  String _orgType = '';
  bool _isAdmin = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final user = ref.read(authProvider).user;
      _orgType = user?.orgType ?? '';
      final role = user?.role.name ?? '';
      _isAdmin = role == 'SUPER_ADMIN' || role == 'HR_ADMIN';

      final api = ref.read(apiServiceProvider);
      final jobService = JobService(api);
      final appService = ApplicationService(api);

      final jobsResult = await jobService.getJobs();
      final appsResult = await appService.getApplications();

      final jobs = (jobsResult is Map && jobsResult['content'] != null)
          ? jobsResult['content'] as List
          : [];
      final apps = (appsResult is Map && appsResult['content'] != null)
          ? appsResult['content'] as List
          : [];

      if (!mounted) return;
      setState(() {
        _activeJobs = jobs.where((j) => j['status'] == 'PUBLISHED').length;
        _submitted = apps.length;
        _shortlisted = apps
            .where(
              (a) =>
                  ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].contains(a['status']),
            )
            .length;
        _recentApps = apps.take(5).cast<Map<String, dynamic>>().toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.firstName ?? '';
    final isVendor = _orgType == 'VENDOR';

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildBanner(firstName, isVendor),
          const SizedBox(height: 20),
          _buildStats(isVendor),
          const SizedBox(height: 20),
          _buildQuickActions(isVendor),
          const SizedBox(height: 20),
          if (isVendor) _buildRecentApps(),
        ],
      ),
    );
  }

  Widget _buildBanner(String firstName, bool isVendor) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isVendor
              ? [
                  const Color(0xFF059669),
                  const Color(0xFF0D9488),
                  const Color(0xFF06B6D4),
                ]
              : [
                  const Color(0xFF4F46E5),
                  const Color(0xFF9333EA),
                  const Color(0xFFEC4899),
                ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isVendor ? 'VENDOR PORTAL' : 'MANAGEMENT SYSTEM',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.white70,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Welcome back, $firstName! ${isVendor ? "🚀" : "👋"}',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isVendor
                ? 'Find opportunities and submit your best candidates.'
                : "Here's what's happening with your system today.",
            style: const TextStyle(fontSize: 14, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _buildStats(bool isVendor) {
    if (isVendor) {
      return GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.5,
        children: [
          StatCard(
            label: 'Published Jobs',
            value: _loading ? '—' : '$_activeJobs',
            icon: Icons.work,
            gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          ),
          StatCard(
            label: 'My Candidates',
            value: _loading ? '—' : '$_candidates',
            icon: Icons.people,
            gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          ),
          StatCard(
            label: 'Submitted',
            value: _loading ? '—' : '$_submitted',
            icon: Icons.send,
            gradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          ),
          StatCard(
            label: 'Shortlisted',
            value: _loading ? '—' : '$_shortlisted',
            icon: Icons.star,
            gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
          ),
        ],
      );
    }
    // Solventek stats
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        StatCard(
          label: 'Active Jobs',
          value: _loading ? '—' : '$_activeJobs',
          icon: Icons.work,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
        ),
        StatCard(
          label: 'Total Candidates',
          value: _loading ? '—' : '$_candidates',
          icon: Icons.people,
          gradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
        ),
        StatCard(
          label: 'Total Applications',
          value: _loading ? '—' : '$_submitted',
          icon: Icons.description,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
        ),
        StatCard(
          label: 'Pending Approvals',
          value: _loading ? '—' : '0',
          icon: Icons.schedule,
          gradient: const [Color(0xFFF97316), Color(0xFFEA580C)],
        ),
      ],
    );
  }

  Widget _buildQuickActions(bool isVendor) {
    if (isVendor) {
      return Column(
        children: [
          QuickActionCard(
            title: 'Browse Jobs',
            subtitle: 'Find published job openings',
            icon: Icons.search,
            iconGradient: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
            onTap: () => context.go('/jobs'),
          ),
          const SizedBox(height: 10),
          QuickActionCard(
            title: 'Manage Candidates',
            subtitle: 'Add and update profiles',
            icon: Icons.person_add,
            iconGradient: const [Color(0xFF10B981), Color(0xFF059669)],
            onTap: () => context.go('/candidates'),
          ),
        ],
      );
    }
    return Column(
      children: [
        QuickActionCard(
          title: 'Create Job',
          subtitle: 'Post a new job opening',
          icon: Icons.add,
          iconGradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          onTap: () => context.go('/jobs/create'),
        ),
        const SizedBox(height: 10),
        QuickActionCard(
          title: 'View Employees',
          subtitle: 'Browse talent pool',
          icon: Icons.person_add,
          iconGradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          onTap: () => context.go('/admin/employees'),
        ),
        const SizedBox(height: 10),
        QuickActionCard(
          title: 'Applications',
          subtitle: 'Manage pipeline',
          icon: Icons.view_kanban,
          iconGradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => context.go('/applications'),
        ),
      ],
    );
  }

  Widget _buildRecentApps() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Applications',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                GestureDetector(
                  onTap: () => context.go('/track-applications'),
                  child: const Text(
                    'View All →',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF6366F1),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (_recentApps.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(
                    Icons.description,
                    size: 48,
                    color: Colors.grey.shade300,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'No applications yet',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF4B5563),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Start by applying candidates to open jobs',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                  ),
                ],
              ),
            )
          else
            ...List.generate(_recentApps.length, (i) {
              final app = _recentApps[i];
              final firstName = app['firstName'] ?? '';
              final lastName = app['lastName'] ?? '';
              final jobTitle = app['job']?['title'] ?? 'Unknown';
              final status = app['status'] ?? '';
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFFEEF2FF),
                  child: Text(
                    '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF6366F1),
                      fontSize: 13,
                    ),
                  ),
                ),
                title: Text(
                  jobTitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                subtitle: Text(
                  '$firstName $lastName',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                ),
                trailing: _statusBadge(status),
              );
            }),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color bg, fg;
    if (['APPLIED'].contains(status)) {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFFB45309);
    } else if ([
      'SCREENING',
      'SHORTLISTED',
      'INTERVIEW_SCHEDULED',
    ].contains(status)) {
      bg = const Color(0xFFDBEAFE);
      fg = const Color(0xFF1D4ED8);
    } else if (['OFFERED', 'HIRED', 'ONBOARDED'].contains(status)) {
      bg = const Color(0xFFD1FAE5);
      fg = const Color(0xFF059669);
    } else if (['REJECTED', 'DROPPED'].contains(status)) {
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFFDC2626);
    } else {
      bg = Colors.grey.shade100;
      fg = Colors.grey.shade700;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }
}
