import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';

/// User Details page matching Angular's UserDetailsComponent.
/// Shows profile header, info sections, and tabbed content.
class UserDetailsPage extends ConsumerStatefulWidget {
  final String userId;
  const UserDetailsPage({super.key, required this.userId});
  @override
  ConsumerState<UserDetailsPage> createState() => _UserDetailsPageState();
}

class _UserDetailsPageState extends ConsumerState<UserDetailsPage>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _user;
  bool _loading = true;
  late TabController _tabController;
  final _tabs = const [
    'Overview',
    'Career',
    'Education',
    'Skills',
    'Documents',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _loadUser();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool get _canManage {
    final role = ref.read(authProvider).user?.role.name;
    return role == 'SUPER_ADMIN' || role == 'HR_ADMIN';
  }

  Future<void> _loadUser() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final userService = UserService(api);
      final data = await userService.getUser(widget.userId);
      if (mounted)
        setState(() {
          _user = data;
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      final api = ref.read(apiServiceProvider);
      final userService = UserService(api);
      await userService.updateStatus(widget.userId, {
        'employmentStatus': status,
      });
      _loadUser();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_user == null)
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.grey.shade300),
              const SizedBox(height: 12),
              const Text('User not found'),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/admin/employees'),
                child: const Text('Back to Users'),
              ),
            ],
          ),
        ),
      );

    final u = _user!;
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: RefreshIndicator(
        onRefresh: _loadUser,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildProfileHeader(u)),
            SliverToBoxAdapter(child: _buildInfoCards(u)),
            SliverToBoxAdapter(child: _buildTabBar()),
            SliverFillRemaining(child: _buildTabContent(u)),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(Map<String, dynamic> u) {
    final firstName = u['firstName'] ?? '';
    final lastName = u['lastName'] ?? '';
    final initials =
        '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
            .toUpperCase();
    final designation = u['designation'] ?? '';
    final department = u['department'] ?? '';
    final status = u['employmentStatus'] ?? 'ACTIVE';
    final email = u['email'] ?? '';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFFEC4899)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () => context.go('/admin/employees'),
                ),
                const Spacer(),
                if (_canManage) ...[
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, color: Colors.white),
                    onSelected: (v) {
                      if (v == 'edit')
                        context.go('/admin/employees/${widget.userId}/edit');
                      else if (v == 'active')
                        _updateStatus('ACTIVE');
                      else if (v == 'inactive')
                        _updateStatus('INACTIVE');
                      else if (v == 'terminated')
                        _updateStatus('TERMINATED');
                    },
                    itemBuilder: (_) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Text('Edit User'),
                      ),
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        value: 'active',
                        child: Text('Set Active'),
                      ),
                      const PopupMenuItem(
                        value: 'inactive',
                        child: Text('Set Inactive'),
                      ),
                      const PopupMenuItem(
                        value: 'terminated',
                        child: Text('Terminate'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {}, // Photo change
              child: CircleAvatar(
                radius: 44,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(
                  initials,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '$firstName $lastName',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            if (designation.isNotEmpty)
              Text(
                designation,
                style: const TextStyle(fontSize: 14, color: Colors.white70),
              ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (department.isNotEmpty)
                  _chip(
                    department,
                    Icons.business,
                    Colors.white.withValues(alpha: 0.15),
                  ),
                const SizedBox(width: 8),
                _statusChip(status),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              email,
              style: const TextStyle(fontSize: 13, color: Colors.white60),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, IconData icon, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white70),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String status) {
    Color bg, fg;
    switch (status) {
      case 'ACTIVE':
        bg = const Color(0xFF10B981);
        fg = Colors.white;
      case 'INACTIVE':
      case 'TERMINATED':
        bg = const Color(0xFFEF4444);
        fg = Colors.white;
      default:
        bg = const Color(0xFFF59E0B);
        fg = Colors.white;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }

  Widget _buildInfoCards(Map<String, dynamic> u) {
    final role = u['role']?['name'] ?? 'N/A';
    final empCode = u['employeeCode'] ?? 'N/A';
    final phone = u['phone'] ?? 'N/A';
    final doj = u['dateOfJoining'] ?? 'N/A';
    final manager = u['manager'];
    final managerName = manager != null
        ? '${manager['firstName'] ?? ''} ${manager['lastName'] ?? ''}'
        : 'N/A';
    final workLoc = u['workLocation'] ?? 'N/A';

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          _infoCard('Role', role, Icons.shield, const Color(0xFF6366F1)),
          _infoCard(
            'Employee ID',
            empCode,
            Icons.badge,
            const Color(0xFF3B82F6),
          ),
          _infoCard('Phone', phone, Icons.phone, const Color(0xFF10B981)),
          _infoCard(
            'Joined',
            doj,
            Icons.calendar_today,
            const Color(0xFFF59E0B),
          ),
          _infoCard(
            'Manager',
            managerName,
            Icons.person,
            const Color(0xFFA855F7),
          ),
          _infoCard(
            'Location',
            workLoc,
            Icons.location_on,
            const Color(0xFFEF4444),
          ),
        ],
      ),
    );
  }

  Widget _infoCard(String label, String value, IconData icon, Color color) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 10),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade400,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: const Color(0xFF6366F1),
        unselectedLabelColor: Colors.grey.shade500,
        indicatorColor: const Color(0xFF6366F1),
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        tabs: _tabs.map((t) => Tab(text: t)).toList(),
      ),
    );
  }

  Widget _buildTabContent(Map<String, dynamic> u) {
    return TabBarView(
      controller: _tabController,
      children: [
        _overviewTab(u),
        _placeholderTab('Career', Icons.trending_up),
        _placeholderTab('Education', Icons.school),
        _placeholderTab('Skills', Icons.psychology),
        _placeholderTab('Documents', Icons.folder),
      ],
    );
  }

  Widget _overviewTab(Map<String, dynamic> u) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionCard('Personal Information', [
          _row('Full Name', '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'),
          _row('Email', u['email'] ?? ''),
          _row('Phone', u['phone'] ?? 'N/A'),
          _row('Date of Birth', u['dateOfBirth'] ?? 'N/A'),
          _row('Gender', u['gender'] ?? 'N/A'),
        ]),
        const SizedBox(height: 12),
        _sectionCard('Employment', [
          _row('Employee Code', u['employeeCode'] ?? 'N/A'),
          _row('Department', u['department'] ?? 'N/A'),
          _row('Designation', u['designation'] ?? 'N/A'),
          _row('Employment Type', u['employmentType'] ?? 'N/A'),
          _row('Work Location', u['workLocation'] ?? 'N/A'),
          _row('Grade Level', u['gradeLevel'] ?? 'N/A'),
          _row('Date of Joining', u['dateOfJoining'] ?? 'N/A'),
        ]),
        const SizedBox(height: 12),
        if (u['address'] != null) ...[
          _sectionCard('Address', [
            _row('Street', u['address']['street'] ?? ''),
            _row('City', u['address']['city'] ?? ''),
            _row('State', u['address']['state'] ?? ''),
            _row('Country', u['address']['country'] ?? ''),
            _row('Zip Code', u['address']['zipCode'] ?? ''),
          ]),
          const SizedBox(height: 12),
        ],
        if (u['emergencyContact'] != null)
          _sectionCard('Emergency Contact', [
            _row('Name', u['emergencyContact']['contactName'] ?? ''),
            _row('Relationship', u['emergencyContact']['relationship'] ?? ''),
            _row('Phone', u['emergencyContact']['contactPhone'] ?? ''),
            _row('Email', u['emergencyContact']['contactEmail'] ?? ''),
          ]),
      ],
    );
  }

  Widget _sectionCard(String title, List<Widget> rows) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, color: Color(0xFF1F2937)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderTab(String title, IconData icon) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade400,
            ),
          ),
          Text(
            'Coming soon',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }
}
