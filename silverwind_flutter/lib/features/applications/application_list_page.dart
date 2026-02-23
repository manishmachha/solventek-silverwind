import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/domain_services.dart';

class ApplicationListPage extends ConsumerStatefulWidget {
  const ApplicationListPage({super.key});
  @override
  ConsumerState<ApplicationListPage> createState() =>
      _ApplicationListPageState();
}

class _ApplicationListPageState extends ConsumerState<ApplicationListPage> {
  List<Map<String, dynamic>> _applications = [];
  bool _loading = true;
  String _searchQuery = '';
  double? _minRisk;
  double? _maxRisk;
  double? _minCons;
  double? _maxCons;

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
      final svc = ref.read(applicationServiceProvider);
      // Fetch inbound applications
      final result = await svc.getApplications(
        page: 0,
        size: 50,
        mode: 'INBOUND',
      );
      if (!mounted) return;

      List<Map<String, dynamic>> apps = [];
      if (result is Map && result.containsKey('content')) {
        apps = ((result['content'] as List?) ?? [])
            .cast<Map<String, dynamic>>();
      } else if (result is List) {
        apps = result.cast<Map<String, dynamic>>();
      }

      // Fetch analysis for each sequentially (as done in Angular, although Angular used forkJoin)
      // To prevent taking too long, we will do it in parallel
      final futures = apps.map((app) async {
        try {
          final analysis = await svc.getLatestAnalysis(app['id']);
          return {...app, 'latestAnalysis': analysis};
        } catch (_) {
          return {...app, 'latestAnalysis': null};
        }
      });
      final enrichedApps = await Future.wait(futures);

      if (mounted) {
        setState(() {
          _applications = enrichedApps;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    return _applications.where((app) {
      final search = _searchQuery.toLowerCase();
      final name = '${app['firstName']} ${app['lastName']}'.toLowerCase();
      final email = (app['email'] ?? '').toString().toLowerCase();
      final company = (app['currentCompany'] ?? '').toString().toLowerCase();
      final status = (app['status'] ?? '').toString().toLowerCase();

      final matchesSearch =
          search.isEmpty ||
          name.contains(search) ||
          email.contains(search) ||
          company.contains(search) ||
          status.contains(search);

      final analysis = app['latestAnalysis'];
      final risk = analysis?['overallRiskScore'] as int?;
      final cons = analysis?['overallConsistencyScore'] as int?;

      if (_minRisk != null && (risk == null || risk < _minRisk!)) return false;
      if (_maxRisk != null && (risk == null || risk > _maxRisk!)) return false;
      if (_minCons != null && (cons == null || cons < _minCons!)) return false;
      if (_maxCons != null && (cons == null || cons > _maxCons!)) return false;

      return matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Header
            const Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Applications',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Manage and track candidate applications',
                        style: TextStyle(color: Colors.grey),
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
                    child: Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        SizedBox(
                          width: 300,
                          child: TextField(
                            controller: _searchController,
                            onChanged: (v) => setState(() => _searchQuery = v),
                            decoration: InputDecoration(
                              hintText: 'Search candidates, companies...',
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
                        // Risk Filter
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _numberInput(
                              'Min Risk',
                              (v) => setState(() => _minRisk = v),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 8),
                              child: Text('-'),
                            ),
                            _numberInput(
                              'Max Risk',
                              (v) => setState(() => _maxRisk = v),
                            ),
                          ],
                        ),
                        // Cons Filter
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _numberInput(
                              'Min Cons.',
                              (v) => setState(() => _minCons = v),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 8),
                              child: Text('-'),
                            ),
                            _numberInput(
                              'Max Cons.',
                              (v) => setState(() => _maxCons = v),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.filter_list_off,
                            color: Colors.red,
                          ),
                          onPressed: () {
                            setState(() {
                              _searchController.clear();
                              _searchQuery = '';
                              _minRisk = null;
                              _maxRisk = null;
                              _minCons = null;
                              _maxCons = null;
                            });
                          },
                          tooltip: 'Clear Filters',
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
                        ), // Ensure it spans properly
                        child: DataTable(
                          headingRowColor: WidgetStateProperty.all(
                            const Color(0xFFF9FAFB),
                          ),
                          dataRowMaxHeight: 80,
                          dataRowMinHeight: 80,
                          columns: const [
                            DataColumn(
                              label: Text(
                                'Candidate',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Job',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Experience',
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
                                'Status',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Risk',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            DataColumn(
                              label: Text(
                                'Consistency',
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
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: Colors.indigo.shade50,
                                        foregroundColor: Colors.indigo,
                                        child: Text(
                                          '${app['firstName']?[0] ?? ''}${app['lastName']?[0] ?? ''}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
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
                                        app['job']?['title'] ?? '',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        app['job']?['organization']?['name'] ??
                                            '',
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
                                    '${app['experienceYears'] ?? 0} Yrs',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                DataCell(Text(app['currentCompany'] ?? 'N/A')),
                                DataCell(
                                  _statusBadge(app['status'] ?? 'APPLIED'),
                                ),
                                DataCell(
                                  _buildProgressBar(
                                    app['latestAnalysis']?['overallRiskScore'],
                                    isRisk: true,
                                  ),
                                ),
                                DataCell(
                                  _buildProgressBar(
                                    app['latestAnalysis']?['overallConsistencyScore'],
                                    isRisk: false,
                                  ),
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

  Widget _numberInput(String hint, Function(double?) onChanged) {
    return SizedBox(
      width: 100,
      child: TextField(
        keyboardType: TextInputType.number,
        onChanged: (v) => onChanged(double.tryParse(v)),
        textAlign: TextAlign.center,
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color bg, text;
    switch (status) {
      case 'APPLIED':
      case 'SHORTLISTED':
        bg = Colors.indigo.shade50;
        text = Colors.indigo;
        break;
      case 'INTERVIEW_SCHEDULED':
        bg = Colors.amber.shade50;
        text = Colors.amber.shade700;
        break;
      case 'OFFERED':
      case 'ONBOARDED':
        bg = Colors.green.shade50;
        text = Colors.green;
        break;
      case 'REJECTED':
        bg = Colors.red.shade50;
        text = Colors.red;
        break;
      default:
        bg = Colors.grey.shade100;
        text = Colors.grey.shade700;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: text,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildProgressBar(int? score, {required bool isRisk}) {
    if (score == null) {
      return Row(
        children: [
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 8),
          Text(
            'Pending',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
          ),
        ],
      );
    }

    Color color;
    if (isRisk) {
      if (score > 70)
        color = Colors.red;
      else if (score > 40)
        color = Colors.orange;
      else
        color = Colors.green;
    } else {
      color = Colors.indigo;
    }

    return SizedBox(
      width: 100,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$score%',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: score / 100,
            backgroundColor: Colors.grey.shade200,
            color: color,
            borderRadius: BorderRadius.circular(4),
            minHeight: 6,
          ),
        ],
      ),
    );
  }
}
