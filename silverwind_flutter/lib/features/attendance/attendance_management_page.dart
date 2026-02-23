import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_colors.dart';
import '../../config/app_constants.dart';
import '../../core/services/domain_services.dart';

class AttendanceManagementPage extends ConsumerStatefulWidget {
  const AttendanceManagementPage({super.key});
  @override
  ConsumerState<AttendanceManagementPage> createState() => _AttendanceManagementPageState();
}

class _AttendanceManagementPageState extends ConsumerState<AttendanceManagementPage> {
  List<dynamic> _items = [];
  bool _loading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  int _totalPages = 0;
  int _totalElements = 0;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(attendanceServiceProvider);
      final result = await svc.getAttendanceRecords();
      if (mounted) {
        setState(() {
          if (result is Map<String, dynamic> && result.containsKey('content')) {
            _items = (result['content'] as List<dynamic>?) ?? [];
            _totalPages = (result['totalPages'] as int?) ?? 0;
            _totalElements = (result['totalElements'] as int?) ?? 0;
          } else if (result is List) {
            _items = result;
            _totalElements = result.length;
          } else {
            _items = [];
          }
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _items = []; _loading = false; });
    }
  }

  List<dynamic> get _filteredItems {
    if (_searchQuery.isEmpty) return _items;
    return _items.where((item) {
      final str = item.toString().toLowerCase();
      return str.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredItems;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(gradient: AppColors.gradientPrimary, borderRadius: BorderRadius.circular(14),
                boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))]),
              child: Icon(Icons.calendar_today, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Attendance Management', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.textMain)),
              Text('$_totalElements total records', style: const TextStyle(fontSize: 14, color: AppColors.textMuted)),
            ])),
          ]),
          const SizedBox(height: 20),

          // Search
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.surface200)),
            child: Row(children: [
              Expanded(child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _searchQuery = v),
                decoration: InputDecoration(
                  hintText: 'Search records...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.surface200)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  isDense: true,
                ),
              )),
              const SizedBox(width: 12),
              IconButton(onPressed: _loadData, icon: const Icon(Icons.refresh), tooltip: 'Refresh'),
            ]),
          ),
          const SizedBox(height: 16),

          // List
          Expanded(child: _loading
            ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
            : filtered.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.inbox_outlined, size: 64, color: AppColors.textLight),
                  const SizedBox(height: 16),
                  Text('No records found', style: TextStyle(fontSize: 16, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
                ]))
              : Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.surface200), boxShadow: AppConstants.shadowCard),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.surface200),
                      itemBuilder: (context, index) {
                        final item = filtered[index] as Map<String, dynamic>;
                        return _buildListItem(item);
                      },
                    ),
                  ),
                ),
          ),

          // Pagination
          if (_totalPages > 1) Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              IconButton(onPressed: _currentPage > 0 ? () { setState(() => _currentPage--); _loadData(); } : null, icon: const Icon(Icons.chevron_left)),
              Text('Page ${_currentPage + 1} of $_totalPages', style: const TextStyle(fontWeight: FontWeight.w500)),
              IconButton(onPressed: _currentPage < _totalPages - 1 ? () { setState(() => _currentPage++); _loadData(); } : null, icon: const Icon(Icons.chevron_right)),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildListItem(Map<String, dynamic> item) {
    final name = item['firstName'] != null ? '${item['firstName']} ${item['lastName'] ?? ''}' 
                : item['title'] ?? item['name'] ?? item['subject'] ?? item['assetTag'] ?? 'Item';
    final subtitle = item['email'] ?? item['status'] ?? item['type'] ?? item['department'] ?? '';
    final status = item['status'] as String? ?? item['employmentStatus'] as String?;
    final id = item['id']?.toString() ?? '';

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: CircleAvatar(
        backgroundColor: AppColors.primary50,
        child: Text(name.toString().isNotEmpty ? name.toString()[0].toUpperCase() : '?',
          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
      ),
      title: Text(name.toString(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(subtitle.toString(), style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        if (status != null) Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _getStatusColor(status).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _getStatusColor(status))),
        ),
        const SizedBox(width: 8),
        const Icon(Icons.chevron_right, color: AppColors.textLight),
      ]),
      onTap: id.isNotEmpty ? () => context.go('/admin/attendance/$id') : null,
    );
  }

  Color _getStatusColor(String status) {
    final s = status.toUpperCase();
    if (s.contains('ACTIVE') || s.contains('APPROVED') || s.contains('PUBLISHED') || s.contains('ACCEPTED')) return AppColors.success;
    if (s.contains('PENDING') || s.contains('REVIEW') || s.contains('DRAFT')) return AppColors.warning;
    if (s.contains('REJECTED') || s.contains('INACTIVE') || s.contains('CLOSED') || s.contains('CANCELLED')) return AppColors.danger;
    if (s.contains('PROGRESS') || s.contains('SUBMITTED')) return AppColors.info;
    return AppColors.textMuted;
  }
}
