import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';

class UserListPage extends ConsumerStatefulWidget {
  const UserListPage({super.key});
  @override
  ConsumerState<UserListPage> createState() => _UserListPageState();
}

class _UserListPageState extends ConsumerState<UserListPage> {
  bool _loading = true;
  List<dynamic> _users = [];
  int _totalElements = 0;
  int _currentPage = 0;
  int _pageSize = 10;
  String _searchQuery = '';
  String _statusFilter = '';
  String _departmentFilter = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUsers();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _searchQuery = _searchController.text;
    _currentPage = 0;
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final userService = UserService(api);
      final result = await userService.getUsers(
        page: _currentPage,
        size: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        if (result is Map) {
          _users = (result['content'] as List?) ?? [];
          _totalElements = result['totalElements'] ?? 0;
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _statusVariant(String? status) {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
      case 'TERMINATED':
        return 'error';
      case 'ON_LEAVE':
      case 'ON_NOTICE':
        return 'warning';
      default:
        return 'default';
    }
  }

  Color _statusBg(String variant) {
    switch (variant) {
      case 'success':
        return const Color(0xFFDCFCE7);
      case 'error':
        return const Color(0xFFFEE2E2);
      case 'warning':
        return const Color(0xFFFEF3C7);
      default:
        return const Color(0xFFF3F4F6);
    }
  }

  Color _statusFg(String variant) {
    switch (variant) {
      case 'success':
        return const Color(0xFF166534);
      case 'error':
        return const Color(0xFF991B1B);
      case 'warning':
        return const Color(0xFF92400E);
      default:
        return const Color(0xFF1F2937);
    }
  }

  Widget _statusBadge(String? status) {
    final v = _statusVariant(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: _statusBg(v),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status ?? 'N/A',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: _statusFg(v),
        ),
      ),
    );
  }

  Widget _roleBadge(String? role) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Text(
        role ?? 'N/A',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: Colors.grey.shade600,
        ),
      ),
    );
  }

  Widget _userAvatar(String firstName, String lastName) {
    final initials =
        '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}';
    return CircleAvatar(
      radius: 20,
      backgroundColor: const Color(0xFFEEF2FF),
      child: Text(
        initials.toUpperCase(),
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          color: Color(0xFF6366F1),
          fontSize: 13,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 768;
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: RefreshIndicator(
        onRefresh: _loadUsers,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Header
            _buildHeader(),
            const SizedBox(height: 20),
            // Filters
            _buildFilters(),
            const SizedBox(height: 16),
            // Content
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: _loading
                  ? _buildSkeleton()
                  : _users.isEmpty
                  ? _buildEmptyState()
                  : isWide
                  ? _buildTable()
                  : _buildMobileCards(),
            ),
            if (!_loading && _users.isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildPagination(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Users',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "Manage your organization's users.",
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            ),
          ],
        ),
        ElevatedButton.icon(
          onPressed: () => _openAddUserDialog(),
          icon: const Icon(Icons.add, size: 18),
          label: const Text('Add User'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4F46E5),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
        ),
      ],
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          // Search
          SizedBox(
            width: 300,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name or email...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon: Icon(
                  Icons.search,
                  color: Colors.grey.shade400,
                  size: 20,
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(
                    color: Color(0xFF6366F1),
                    width: 2,
                  ),
                ),
              ),
            ),
          ),
          // Status filter
          SizedBox(
            width: 160,
            child: DropdownButtonFormField<String>(
              value: _statusFilter,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: '',
                  child: Text('All Statuses', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'ACTIVE',
                  child: Text('Active', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'INACTIVE',
                  child: Text('Inactive', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'TERMINATED',
                  child: Text('Terminated', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'RESIGNED',
                  child: Text('Resigned', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'ON_LEAVE',
                  child: Text('On Leave', style: TextStyle(fontSize: 14)),
                ),
              ],
              onChanged: (v) {
                setState(() => _statusFilter = v ?? '');
                _currentPage = 0;
                _loadUsers();
              },
            ),
          ),
          // Department filter
          SizedBox(
            width: 180,
            child: DropdownButtonFormField<String>(
              value: _departmentFilter,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: '',
                  child: Text(
                    'All Departments',
                    style: TextStyle(fontSize: 14),
                  ),
                ),
                DropdownMenuItem(
                  value: 'Engineering',
                  child: Text('Engineering', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'Product',
                  child: Text('Product', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'HR',
                  child: Text('HR', style: TextStyle(fontSize: 14)),
                ),
                DropdownMenuItem(
                  value: 'Sales',
                  child: Text('Sales', style: TextStyle(fontSize: 14)),
                ),
              ],
              onChanged: (v) {
                setState(() => _departmentFilter = v ?? '');
                _currentPage = 0;
                _loadUsers();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSkeleton() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: List.generate(
          5,
          (_) => Container(
            height: 48,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        children: [
          Icon(Icons.people_outline, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          const Text(
            'No users found',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Try adjusting your search or filters.',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () {
              _searchController.clear();
              setState(() {
                _statusFilter = '';
                _departmentFilter = '';
              });
              _loadUsers();
            },
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Clear Filters'),
          ),
        ],
      ),
    );
  }

  Widget _buildTable() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: DataTable(
        headingRowColor: WidgetStateProperty.all(const Color(0xFFF9FAFB)),
        dataRowMinHeight: 60,
        dataRowMaxHeight: 72,
        columnSpacing: 24,
        columns: const [
          DataColumn(
            label: Text(
              'Name',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          DataColumn(
            label: Text(
              'Designation',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          DataColumn(
            label: Text(
              'Status',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          DataColumn(
            label: Text(
              'Role',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          DataColumn(
            label: Text(
              'Actions',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
        rows: _users.map((user) {
          final firstName = user['firstName'] ?? '';
          final lastName = user['lastName'] ?? '';
          final email = user['email'] ?? '';
          final designation = user['designation'] ?? '';
          final department = user['department'] ?? '';
          final status = user['employmentStatus'] ?? '';
          final role = user['role']?['name'] ?? '';
          final id = user['id'] ?? '';

          return DataRow(
            cells: [
              DataCell(
                Row(
                  children: [
                    _userAvatar(firstName, lastName),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '$firstName $lastName',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: Color(0xFF111827),
                          ),
                        ),
                        Text(
                          email,
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
              DataCell(
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      designation,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF111827),
                      ),
                    ),
                    Text(
                      department,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              DataCell(_statusBadge(status)),
              DataCell(_roleBadge(role)),
              DataCell(
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.visibility_outlined,
                        size: 18,
                        color: Color(0xFF0284C7),
                      ),
                      tooltip: 'View Details',
                      onPressed: () => context.go('/admin/employees/$id'),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.edit_outlined,
                        size: 18,
                        color: Color(0xFF6366F1),
                      ),
                      tooltip: 'Edit',
                      onPressed: () => _openEditUserDialog(user),
                    ),
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMobileCards() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: _users.map((user) {
          final firstName = user['firstName'] ?? '';
          final lastName = user['lastName'] ?? '';
          final email = user['email'] ?? '';
          final designation = user['designation'] ?? '';
          final department = user['department'] ?? '';
          final status = user['employmentStatus'] ?? '';
          final role = user['role']?['name'] ?? '';
          final id = user['id'] ?? '';

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        _userAvatar(firstName, lastName),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$firstName $lastName',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: Color(0xFF111827),
                              ),
                            ),
                            Text(
                              designation,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    _statusBadge(status),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'DEPARTMENT',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade400,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            department,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF374151),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'ROLE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade400,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            role,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF374151),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Divider(color: Colors.grey.shade100, height: 1),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      email,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade400,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      children: [
                        TextButton(
                          onPressed: () => context.go('/admin/employees/$id'),
                          child: const Text(
                            'View',
                            style: TextStyle(
                              color: Color(0xFF6366F1),
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => _openEditUserDialog(user),
                          child: const Text(
                            'Edit',
                            style: TextStyle(
                              color: Color(0xFF6366F1),
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPagination() {
    final totalPages = (_totalElements / _pageSize).ceil();
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Showing ${_currentPage * _pageSize + 1}–${((_currentPage + 1) * _pageSize).clamp(0, _totalElements)} of $_totalElements',
          style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
        ),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: _currentPage > 0
                  ? () {
                      setState(() => _currentPage--);
                      _loadUsers();
                    }
                  : null,
            ),
            Text(
              '${_currentPage + 1} / $totalPages',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: _currentPage < totalPages - 1
                  ? () {
                      setState(() => _currentPage++);
                      _loadUsers();
                    }
                  : null,
            ),
          ],
        ),
      ],
    );
  }

  void _openAddUserDialog() {
    // TODO: Navigate to user create page or show dialog
    context.go('/admin/employees/create');
  }

  void _openEditUserDialog(dynamic user) {
    final id = user['id'] ?? '';
    context.go('/admin/employees/$id/edit');
  }
}
