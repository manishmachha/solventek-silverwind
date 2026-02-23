import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/domain_services.dart';

/// Job List page matching Angular's JobListComponent.
/// Card grid layout with search, status filter, org logo, status badges, and Apply button.
class JobListPage extends ConsumerStatefulWidget {
  const JobListPage({super.key});
  @override
  ConsumerState<JobListPage> createState() => _JobListPageState();
}

class _JobListPageState extends ConsumerState<JobListPage> {
  List<Map<String, dynamic>> _jobs = [];
  bool _loading = true;
  String _searchQuery = '';
  String _statusFilter = '';
  int _currentPage = 0;
  int _totalPages = 0;
  int _totalElements = 0;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadJobs() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(jobServiceProvider);
      final result = await svc.getJobs(page: _currentPage);
      if (!mounted) return;
      setState(() {
        if (result is Map && result.containsKey('content')) {
          _jobs = ((result['content'] as List?) ?? [])
              .cast<Map<String, dynamic>>();
          _totalPages = result['totalPages'] ?? 0;
          _totalElements = result['totalElements'] ?? 0;
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    var list = _jobs;
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list
          .where(
            (j) =>
                (j['title'] ?? '').toString().toLowerCase().contains(q) ||
                (j['organization']?['name'] ?? '')
                    .toString()
                    .toLowerCase()
                    .contains(q) ||
                (j['location'] ?? '').toString().toLowerCase().contains(q),
          )
          .toList();
    }
    if (_statusFilter.isNotEmpty) {
      list = list.where((j) => j['status'] == _statusFilter).toList();
    }
    return list;
  }

  bool get _isEmployee => ref.read(authProvider).user?.role.name == 'EMPLOYEE';

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: RefreshIndicator(
        onRefresh: _loadJobs,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Job Board',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                  ),
                ),
                if (!_isEmployee)
                  ElevatedButton.icon(
                    onPressed: () => context.go('/jobs/create'),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Post New Job'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            // Filters
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: (v) => setState(() => _searchQuery = v),
                      decoration: InputDecoration(
                        hintText:
                            'Search by title, organization, or location...',
                        hintStyle: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 14,
                        ),
                        prefixIcon: Icon(
                          Icons.search,
                          color: Colors.grey.shade400,
                          size: 20,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 180,
                    child: DropdownButtonFormField<String>(
                      value: _statusFilter,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: '',
                          child: Text(
                            'All Statuses',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'DRAFT',
                          child: Text('Draft', style: TextStyle(fontSize: 14)),
                        ),
                        DropdownMenuItem(
                          value: 'SUBMITTED',
                          child: Text(
                            'Submitted',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'ADMIN_VERIFIED',
                          child: Text(
                            'Admin Verified',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'TA_ENRICHED',
                          child: Text(
                            'TA Enriched',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'ADMIN_FINAL_VERIFIED',
                          child: Text(
                            'Final Verified',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'PUBLISHED',
                          child: Text(
                            'Published',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'PAUSED',
                          child: Text('Paused', style: TextStyle(fontSize: 14)),
                        ),
                        DropdownMenuItem(
                          value: 'CLOSED',
                          child: Text('Closed', style: TextStyle(fontSize: 14)),
                        ),
                      ],
                      onChanged: (v) => setState(() => _statusFilter = v ?? ''),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Content
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(48),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (filtered.isEmpty)
              _buildEmptyState()
            else
              _buildCardGrid(filtered),
            // Pagination
            if (!_loading && _totalPages > 1) ...[
              const SizedBox(height: 16),
              _buildPagination(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 64),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey.shade200,
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        children: [
          Icon(Icons.work_outline, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          const Text(
            'No jobs found',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            'Get started by creating a new job posting.',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
          ),
          if (!_isEmployee) ...[
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => context.go('/jobs/create'),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Create Job'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCardGrid(List<Map<String, dynamic>> jobs) {
    return LayoutBuilder(
      builder: (ctx, constraints) {
        int cols = constraints.maxWidth > 900
            ? 3
            : constraints.maxWidth > 600
            ? 2
            : 1;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: jobs
              .map(
                (job) => SizedBox(
                  width: (constraints.maxWidth - (cols - 1) * 16) / cols,
                  child: _buildJobCard(job),
                ),
              )
              .toList(),
        );
      },
    );
  }

  Widget _buildJobCard(Map<String, dynamic> job) {
    final title = job['title'] ?? '';
    final orgName = job['organization']?['name'] ?? 'Internal';
    final description = job['description'] ?? '';
    final status = job['status'] ?? 'DRAFT';
    final employmentType = (job['employmentType'] ?? '').toString().replaceAll(
      '_',
      ' ',
    );
    final location = job['location'] ?? '';
    final id = job['id']?.toString() ?? '';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with org + status
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        orgName.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => context.go('/jobs/$id'),
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                _statusBadge(status),
              ],
            ),
          ),
          // Description
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Text(
              description,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Tags
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                if (employmentType.isNotEmpty)
                  _tag(Icons.work_outline, employmentType),
                if (location.isNotEmpty)
                  _tag(Icons.location_on_outlined, location),
              ],
            ),
          ),
          // Footer
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              border: Border(top: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: () => context.go('/jobs/$id'),
                  child: Text(
                    'ID: ${id.length > 8 ? '${id.substring(0, 8)}...' : id}',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                  ),
                ),
                Row(
                  children: [
                    if (status == 'PUBLISHED')
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4F46E5),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 20,
                            ),
                            minimumSize: Size.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                            elevation: 0,
                            textStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          child: const Text('Apply'),
                        ),
                      ),
                    OutlinedButton(
                      onPressed: () => context.go('/jobs/$id'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 20,
                        ),
                        minimumSize: Size.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                        textStyle: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      child: const Text('Details →'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final colors = _statusColors(status);
    final label = status.replaceAll('_', ' ');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors[0],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: colors[1],
        ),
      ),
    );
  }

  List<Color> _statusColors(String s) {
    switch (s) {
      case 'PUBLISHED':
        return [const Color(0xFFDCFCE7), const Color(0xFF166534)];
      case 'SUBMITTED':
        return [const Color(0xFFFEF3C7), const Color(0xFF92400E)];
      case 'VENDOR_SUBMITTED':
        return [const Color(0xFFFEF3C7), const Color(0xFF92400E)];
      case 'ADMIN_VERIFIED':
        return [const Color(0xFFDBEAFE), const Color(0xFF1E40AF)];
      case 'TA_ENRICHED':
        return [const Color(0xFFF3E8FF), const Color(0xFF6B21A8)];
      case 'ADMIN_FINAL_VERIFIED':
        return [const Color(0xFFE0F2FE), const Color(0xFF0369A1)];
      case 'CLOSED':
        return [const Color(0xFFFEE2E2), const Color(0xFF991B1B)];
      case 'PAUSED':
        return [const Color(0xFFFFF7ED), const Color(0xFFC2410C)];
      default:
        return [const Color(0xFFF3F4F6), const Color(0xFF374151)];
    }
  }

  Widget _tag(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.grey.shade600),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Page ${_currentPage + 1} of $_totalPages',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: _currentPage > 0
                    ? () {
                        setState(() => _currentPage--);
                        _loadJobs();
                      }
                    : null,
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: _currentPage < _totalPages - 1
                    ? () {
                        setState(() => _currentPage++);
                        _loadJobs();
                      }
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
