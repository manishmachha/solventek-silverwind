import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/domain_services.dart';
import '../../core/providers/auth_provider.dart';

class TrackApplicationListPage extends ConsumerStatefulWidget {
  const TrackApplicationListPage({super.key});
  @override
  ConsumerState<TrackApplicationListPage> createState() =>
      _TrackApplicationListPageState();
}

class _TrackApplicationListPageState
    extends ConsumerState<TrackApplicationListPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _loading = true;
  String _searchQuery = '';
  String _statusFilter = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(applicationServiceProvider);
      final role = ref.read(authProvider).user?.role.name;
      final direction = role == 'VENDOR' ? 'INBOUND' : 'OUTBOUND';
      // Based on Vendor/Employee logic, if vendor they see their submitted apps, etc.

      final result = await svc.getApplications(
        page: 0,
        size: 1000,
        mode: direction,
      );
      if (!mounted) return;

      List<Map<String, dynamic>> apps = [];
      if (result is Map && result.containsKey('content')) {
        apps = ((result['content'] as List?) ?? [])
            .cast<Map<String, dynamic>>();
      } else if (result is List) {
        apps = result.cast<Map<String, dynamic>>();
      }

      setState(() {
        _applications = apps;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    return _applications.where((app) {
      final search = _searchQuery.toLowerCase();
      final title = (app['job']?['title'] ?? '').toString().toLowerCase();
      final company = (app['job']?['organization']?['name'] ?? '')
          .toString()
          .toLowerCase();
      final name = '${app['firstName']} ${app['lastName']}'.toLowerCase();
      final status = (app['status'] ?? '').toString();

      final matchesSearch =
          search.isEmpty ||
          title.contains(search) ||
          company.contains(search) ||
          name.contains(search);

      final matchesStatus = _statusFilter.isEmpty || status == _statusFilter;

      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final title = ref.read(authProvider).user?.role.name == 'VENDOR'
        ? 'My Submissions'
        : 'Track Applications';
    final subtitle = ref.read(authProvider).user?.role.name == 'VENDOR'
        ? 'Track candidates you have submitted'
        : 'Monitor the status of your outbound applications';

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Main Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  // Toolbar
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Colors.grey.shade100),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 5,
                          child: TextField(
                            onChanged: (v) => setState(() => _searchQuery = v),
                            decoration: InputDecoration(
                              hintText:
                                  'Search by role, company or applicant...',
                              prefixIcon: const Icon(
                                Icons.search,
                                color: Colors.grey,
                              ),
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 14,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 4,
                          child: DropdownButtonFormField<String>(
                            value: _statusFilter.isEmpty ? null : _statusFilter,
                            hint: const Text('All Statuses'),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 14,
                                horizontal: 16,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: '',
                                child: Text('All Statuses'),
                              ),
                              DropdownMenuItem(
                                value: 'APPLIED',
                                child: Text('APPLIED'),
                              ),
                              DropdownMenuItem(
                                value: 'SHORTLISTED',
                                child: Text('SHORTLISTED'),
                              ),
                              DropdownMenuItem(
                                value: 'INTERVIEW_SCHEDULED',
                                child: Text('INTERVIEW SCHEDULED'),
                              ),
                              DropdownMenuItem(
                                value: 'INTERVIEW_PASSED',
                                child: Text('INTERVIEW PASSED'),
                              ),
                              DropdownMenuItem(
                                value: 'INTERVIEW_FAILED',
                                child: Text('INTERVIEW FAILED'),
                              ),
                              DropdownMenuItem(
                                value: 'OFFERED',
                                child: Text('OFFERED'),
                              ),
                              DropdownMenuItem(
                                value: 'ONBOARDING_IN_PROGRESS',
                                child: Text('ONBOARDING IN PROGRESS'),
                              ),
                              DropdownMenuItem(
                                value: 'ONBOARDED',
                                child: Text('ONBOARDED'),
                              ),
                              DropdownMenuItem(
                                value: 'REJECTED',
                                child: Text('REJECTED'),
                              ),
                            ],
                            onChanged: (v) =>
                                setState(() => _statusFilter = v ?? ''),
                          ),
                        ),
                        const SizedBox(width: 16),
                        if (_searchQuery.isNotEmpty || _statusFilter.isNotEmpty)
                          TextButton.icon(
                            onPressed: () => setState(() {
                              _searchQuery = '';
                              _statusFilter = '';
                            }),
                            icon: const Icon(Icons.filter_list_off),
                            label: const Text('Clear Filters'),
                            style: TextButton.styleFrom(
                              foregroundColor: Colors.red,
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Table
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.all(48),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (_filtered.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(48),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 48,
                              color: Colors.grey,
                            ),
                            SizedBox(height: 16),
                            Text(
                              'No applications found',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minWidth: MediaQuery.of(context).size.width - 48,
                        ),
                        child: DataTable(
                          headingRowColor: WidgetStateProperty.all(
                            const Color(0xFFF9FAFB),
                          ),
                          dataRowMaxHeight: 80,
                          dataRowMinHeight: 80,
                          columns: const [
                            DataColumn(
                              label: Text(
                                'Role',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Applicant',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Company',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Applied On',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Status',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(label: Text('')),
                          ],
                          rows: _filtered.map((app) {
                            return DataRow(
                              cells: [
                                DataCell(
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        app['job']?['title'] ?? '',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        'ID: #${(app['job']?['id']?.toString() ?? '1').substring(0, 8)}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                DataCell(
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${app['firstName']} ${app['lastName']}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        app['email'] ?? '',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                DataCell(
                                  Text(
                                    app['job']?['organization']?['name'] ??
                                        'Unknown',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                DataCell(
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.calendar_today,
                                        size: 14,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        ((app['createdAt'] ?? '').toString())
                                            .split('T')
                                            .first,
                                      ),
                                    ],
                                  ),
                                ),
                                DataCell(
                                  _statusBadge(app['status'] ?? 'APPLIED'),
                                ),
                                DataCell(
                                  IconButton(
                                    icon: const Icon(
                                      Icons.chevron_right,
                                      color: Colors.grey,
                                    ),
                                    onPressed: () => context.go(
                                      '/applications/${app['id']}',
                                    ),
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color bg, text, border;
    switch (status) {
      case 'APPLIED':
        bg = Colors.blue.shade50;
        text = Colors.blue.shade700;
        border = Colors.blue.shade200;
        break;
      case 'SHORTLISTED':
        bg = Colors.purple.shade50;
        text = Colors.purple.shade700;
        border = Colors.purple.shade200;
        break;
      case 'INTERVIEW_SCHEDULED':
        bg = Colors.amber.shade50;
        text = Colors.amber.shade700;
        border = Colors.amber.shade200;
        break;
      case 'INTERVIEW_PASSED':
        bg = Colors.indigo.shade50;
        text = Colors.indigo.shade700;
        border = Colors.indigo.shade200;
        break;
      case 'OFFERED':
      case 'ONBOARDED':
        bg = Colors.green.shade50;
        text = Colors.green.shade700;
        border = Colors.green.shade200;
        break;
      case 'REJECTED':
        bg = Colors.red.shade50;
        text = Colors.red.shade700;
        border = Colors.red.shade200;
        break;
      default:
        bg = Colors.grey.shade50;
        text = Colors.grey.shade700;
        border = Colors.grey.shade200;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: text,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
