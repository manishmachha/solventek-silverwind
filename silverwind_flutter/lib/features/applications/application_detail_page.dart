import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/services/domain_services.dart';
import '../../core/providers/auth_provider.dart';

class ApplicationDetailPage extends ConsumerStatefulWidget {
  final String id;
  const ApplicationDetailPage({super.key, required this.id});

  @override
  ConsumerState<ApplicationDetailPage> createState() =>
      _ApplicationDetailPageState();
}

class _ApplicationDetailPageState extends ConsumerState<ApplicationDetailPage> {
  Map<String, dynamic>? _app;
  Map<String, dynamic>? _analysis;
  List<dynamic> _timeline = [];
  List<dynamic> _documents = [];
  bool _loading = true;
  bool _analyzing = false;
  String _newNote = '';

  // Tab index, but since we use DefaultTabController we might just build it in build()
  // However, managing standard tabs is easy.

  bool get _canManage =>
      ref.read(authProvider).user?.role.name != 'EMPLOYEE' &&
      ref.read(authProvider).user?.role.name != 'VENDOR';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final svc = ref.read(applicationServiceProvider);
    try {
      final app = await svc.getApplicationDetails(widget.id);

      Map<String, dynamic>? analysis;
      if (_canManage) {
        try {
          // It throws 404 if no analysis exists
          analysis = await svc.getLatestAnalysis(widget.id);
        } catch (_) {}
      }

      final timeline = await svc.getTimeline(widget.id);
      final docs = await svc.getDocuments(widget.id);

      if (mounted) {
        setState(() {
          _app = app;
          _analysis = analysis;
          _timeline = timeline;
          _documents = docs;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    final svc = ref.read(applicationServiceProvider);
    try {
      await svc.updateStatus(widget.id, status);
      _loadData();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _runAnalysis() async {
    setState(() => _analyzing = true);
    final svc = ref.read(applicationServiceProvider);
    try {
      await svc.runAnalysis(widget.id);
      await _loadData();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Analysis Failed: $e')));
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }

  Future<void> _addNote() async {
    if (_newNote.trim().isEmpty) return;
    final svc = ref.read(applicationServiceProvider);
    try {
      await svc.addApplicationEvent(widget.id, 'COMMENT', _newNote);
      setState(() => _newNote = '');
      await _loadData();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  void _downloadResume() async {
    final svc = ref.read(applicationServiceProvider);
    try {
      final url = await svc.getPresignedResumeUrl(widget.id);
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to get resume: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF9FAFB),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_app == null) {
      return const Scaffold(
        backgroundColor: Color(0xFFF9FAFB),
        body: Center(child: Text('Application not found')),
      );
    }

    final int tabsCount = _canManage ? 5 : 3;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: DefaultTabController(
        length: tabsCount,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _buildHeaderCard(),
            const SizedBox(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_canManage) ...[
                  Expanded(flex: 4, child: _buildLeftColumn()),
                  const SizedBox(width: 24),
                ],
                Expanded(flex: 8, child: _buildRightColumn(tabsCount)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE0E7FF), Color(0xFFEDE9FE)],
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${_app!['firstName'][0]}',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.indigo,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_app!['firstName']} ${_app!['lastName']}',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.email, size: 16, color: Colors.blue),
                      const SizedBox(width: 6),
                      Text(
                        '${_app!['email']}',
                        style: const TextStyle(color: Colors.black54),
                      ),
                      const SizedBox(width: 16),
                      if (_app!['phone'] != null) ...[
                        const Icon(Icons.phone, size: 16, color: Colors.green),
                        const SizedBox(width: 6),
                        Text(
                          '${_app!['phone']}',
                          style: const TextStyle(color: Colors.black54),
                        ),
                        const SizedBox(width: 16),
                      ],
                      const Icon(
                        Icons.business_center,
                        size: 16,
                        color: Colors.amber,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${_app!['currentTitle'] ?? 'Candidate'} at ${_app!['currentCompany'] ?? 'N/A'}',
                        style: const TextStyle(color: Colors.black54),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          Wrap(
            spacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (_canManage)
                Container(
                  width: 180,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _app!['status'],
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      icon: const Icon(Icons.keyboard_arrow_down),
                      items: const [
                        DropdownMenuItem(
                          value: 'APPLIED',
                          child: Text(
                            'Applied',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'SHORTLISTED',
                          child: Text(
                            'Shortlisted',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'INTERVIEW_SCHEDULED',
                          child: Text(
                            'Interview',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'OFFERED',
                          child: Text(
                            'Offered',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'REJECTED',
                          child: Text(
                            'Rejected',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                      onChanged: (v) => _updateStatus(v!),
                    ),
                  ),
                ),
              if (_canManage)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 20,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: _analyzing ? null : _runAnalysis,
                  icon: _analyzing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.analytics),
                  label: Text(
                    _analyzing ? 'Analyzing...' : 'Run Analysis',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.indigo,
                  side: const BorderSide(color: Colors.indigo, width: 2),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 20,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: _downloadResume,
                icon: const Icon(Icons.download),
                label: const Text(
                  'Resume',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLeftColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Risk Profile Card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Risk Profile',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  if (_analysis != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        'v${_analysis!['id']}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 24),

              if (_analysis == null)
                Container(
                  height: 250,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.grey.shade200,
                      style: BorderStyle.none,
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.analytics,
                          size: 48,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No analysis generated',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: _runAnalysis,
                          child: const Text('Generate Now'),
                        ),
                      ],
                    ),
                  ),
                )
              else ...[
                // Radar Chart
                SizedBox(
                  height: 250,
                  child: RadarChart(
                    RadarChartData(
                      radarShape: RadarShape.polygon,
                      ticksTextStyle: const TextStyle(
                        color: Colors.transparent,
                      ),
                      tickBorderData: const BorderSide(
                        color: Colors.transparent,
                      ),
                      gridBorderData: const BorderSide(
                        color: Colors.black12,
                        width: 2,
                      ),
                      radarBorderData: const BorderSide(
                        color: Colors.transparent,
                      ),
                      getTitle: (index, angle) {
                        const labels = [
                          'Overall Risk',
                          'Consistency',
                          'Timeline Risk',
                          'Skill Inflation',
                          'Credibility',
                        ];
                        return RadarChartTitle(
                          text: labels[index % 5],
                          positionPercentageOffset: 0.2,
                        );
                      },
                      titleTextStyle: const TextStyle(
                        color: Colors.black87,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      tickCount: 5,
                      dataSets: [
                        RadarDataSet(
                          fillColor: Colors.indigo.withOpacity(0.2),
                          borderColor: Colors.indigo,
                          entryRadius: 3,
                          dataEntries: [
                            RadarEntry(
                              value:
                                  _analysis!['overallRiskScore']?.toDouble() ??
                                  0,
                            ),
                            RadarEntry(
                              value:
                                  _analysis!['overallConsistencyScore']
                                      ?.toDouble() ??
                                  0,
                            ),
                            RadarEntry(
                              value:
                                  _analysis!['timelineRiskScore']?.toDouble() ??
                                  0,
                            ),
                            RadarEntry(
                              value:
                                  _analysis!['skillInflationScore']
                                      ?.toDouble() ??
                                  0,
                            ),
                            RadarEntry(
                              value:
                                  _analysis!['credibilityScore']?.toDouble() ??
                                  0,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Key Metrics
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.shade100),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'RISK',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                                letterSpacing: 1,
                              ),
                            ),
                            Text(
                              '${_analysis!['overallRiskScore'] ?? 0}%',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: Colors.red.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'CONSISTENCY',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue,
                                letterSpacing: 1,
                              ),
                            ),
                            Text(
                              '${_analysis!['overallConsistencyScore'] ?? 0}%',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Executive Summary
        if (_analysis != null)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.summarize, color: Colors.purple),
                    SizedBox(width: 8),
                    Text(
                      'Executive Summary',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.purple.shade50),
                  ),
                  child: Text(
                    _analysis!['summary'] ?? 'No summary available.',
                    style: const TextStyle(height: 1.5, color: Colors.black87),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildRightColumn(int tabsCount) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            labelColor: Colors.indigo,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.indigo,
            indicatorWeight: 3,
            tabs: [
              const Tab(
                child: Row(
                  children: [
                    Icon(Icons.business_center, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Job Info',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              if (_canManage)
                const Tab(
                  child: Row(
                    children: [
                      Icon(Icons.flag, size: 18, color: Colors.red),
                      SizedBox(width: 8),
                      Text(
                        'Red Flags',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              if (_canManage)
                const Tab(
                  child: Row(
                    children: [
                      Icon(Icons.quiz, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Interview',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              const Tab(
                child: Row(
                  children: [
                    Icon(Icons.folder_open, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Documents',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const Tab(
                child: Row(
                  children: [
                    Icon(Icons.timeline, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Timeline',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(
            height:
                800, // Fixed height or expanded if inside flexible. We are in a ListView, so giving it height is necessary.
            child: TabBarView(
              children: [
                _buildJobTab(),
                if (_canManage) _buildFlagsTab(),
                if (_canManage) _buildInterviewTab(),
                _buildDocsTab(),
                _buildTimelineTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJobTab() {
    final job = _app!['job'] ?? {};
    final org = job['organization'] ?? {};
    final vendor = _app!['vendor'];

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left: Details
            Expanded(
              flex: 2,
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              job['title'] ?? '',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: Colors.grey.shade300,
                                    ),
                                  ),
                                  child: Text(
                                    job['employmentType'] ?? '',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: Colors.blue.shade100,
                                    ),
                                  ),
                                  child: Text(
                                    job['status'] ?? '',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue.shade700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                if (job['experience'] != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.purple.shade50,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: Colors.purple.shade100,
                                      ),
                                    ),
                                    child: Text(
                                      '${job['experience']}+ Years Exp',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.purple.shade700,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        if (_canManage && job['billRate'] != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.green.shade100),
                            ),
                            child: Column(
                              children: [
                                const Text(
                                  'BILL RATE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                    letterSpacing: 1,
                                  ),
                                ),
                                RichText(
                                  text: TextSpan(
                                    children: [
                                      TextSpan(
                                        text: '\$${job['billRate']}',
                                        style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.green.shade700,
                                        ),
                                      ),
                                      TextSpan(
                                        text: '/hr',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.green.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Description',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      job['description'] ?? '',
                      style: const TextStyle(
                        color: Colors.black87,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    const Text(
                      'Requirements',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      job['requirements'] ?? '',
                      style: const TextStyle(
                        color: Colors.black87,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 24),

            // Right: Orgs & Skills
            Expanded(
              flex: 1,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'HIRING ORGANIZATION',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.business,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  org['name'] ?? 'Unknown',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                Container(
                                  margin: const EdgeInsets.only(top: 4),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Text(
                                    org['industry'] ?? 'Technology',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black54,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  if (_canManage && vendor != null) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.amber.shade200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SOURCED BY (VENDOR)',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: Colors.amber.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  Icons.store,
                                  color: Colors.amber.shade700,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    vendor['name'] ?? 'Unknown',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  Container(
                                    margin: const EdgeInsets.only(top: 4),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Text(
                                      'Service Provider',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'REQUIRED SKILLS',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: ((job['skills'] ?? '') as String)
                              .split(',')
                              .where((s) => s.trim().isNotEmpty)
                              .map(
                                (s) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.grey.shade200,
                                    ),
                                  ),
                                  child: Text(
                                    s.trim(),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFlagsTab() {
    if (_analysis == null)
      return const Center(child: Text('No analysis available.'));

    // Parse red flags from string if needed. The API usually returns JSON string for redFlags.
    List<dynamic> flags = [];
    List<dynamic> evidence = [];
    try {
      flags = jsonDecode(_analysis!['redFlags'] ?? '[]');
      evidence = jsonDecode(_analysis!['evidenceSnippets'] ?? '[]');
    } catch (_) {}

    if (flags.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.green.shade100),
              ),
              child: const Icon(
                Icons.verified_user,
                size: 40,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Clean Profile',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const Text(
              'AI analysis detected no significant red flags.',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        ...flags.map((flag) {
          final isHigh = flag['severity'] == 'HIGH';
          final color = isHigh ? Colors.red : Colors.orange;
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4),
              ],
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  Container(
                    width: 4,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        bottomLeft: Radius.circular(12),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.warning, color: color, size: 20),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      flag['category'] ?? '',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                          color: Colors.grey.shade300,
                                        ),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '${flag['severity']} LEVEL',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  flag['description'] ?? '',
                                  style: const TextStyle(
                                    color: Colors.black87,
                                    height: 1.4,
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
            ),
          );
        }).toList(),

        if (evidence.isNotEmpty) ...[
          const SizedBox(height: 32),
          const Text(
            'EVIDENCE SNIPPETS',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 3,
            ),
            itemCount: evidence.length,
            itemBuilder: (context, i) {
              final e = evidence[i];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      e['category'] ?? '',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.indigo,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            left: BorderSide(
                              color: Colors.indigo.shade100,
                              width: 2,
                            ),
                          ),
                        ),
                        padding: const EdgeInsets.only(left: 12),
                        child: Text(
                          '"${e['excerpt']}"',
                          style: const TextStyle(
                            fontStyle: FontStyle.italic,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ],
    );
  }

  Widget _buildInterviewTab() {
    if (_analysis == null)
      return const Center(child: Text('No analysis available.'));

    Map<String, dynamic> qMap = {};
    try {
      qMap = jsonDecode(_analysis!['interviewQuestions'] ?? '{}');
    } catch (_) {}

    if (qMap.isEmpty) {
      return const Center(child: Text('No interview questions generated.'));
    }

    return ListView(
      padding: const EdgeInsets.all(32),
      children: qMap.entries.map((entry) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 4,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.indigo,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    entry.key,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ...((entry.value as List).map(
                (q) => Container(
                  margin: const EdgeInsets.only(bottom: 12, left: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.01),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.help_outline,
                        color: Colors.indigo.shade400,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          q.toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                            color: Colors.black87,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDocsTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        // Upload (Mock UI)
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Upload New Document',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'CATEGORY',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: 'RESUME_SECONDARY',
                          items:
                              [
                                    'RESUME_SECONDARY',
                                    'COVER_LETTER',
                                    'PORTFOLIO',
                                    'CERTIFICATION',
                                  ]
                                  .map(
                                    (c) => DropdownMenuItem(
                                      value: c,
                                      child: Text(c.replaceAll('_', ' ')),
                                    ),
                                  )
                                  .toList(),
                          onChanged: (_) {},
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.grey.shade50,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: Colors.grey.shade300,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'FILE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () {},
                          child: Container(
                            height: 52,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: Colors.indigo.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.file_upload, color: Colors.indigo),
                                SizedBox(width: 12),
                                Text(
                                  'Choose file',
                                  style: TextStyle(
                                    color: Colors.indigo,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 20,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Upload'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        const Text(
          'UPLOADED FILES',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 16),
        if (_documents.isEmpty)
          Container(
            padding: const EdgeInsets.all(48),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.grey.shade200,
                style: BorderStyle.solid,
              ),
            ),
            child: const Center(
              child: Column(
                children: [
                  Icon(Icons.folder_off, size: 48, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No documents uploaded yet.'),
                ],
              ),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 4,
            ),
            itemCount: _documents.length,
            itemBuilder: (context, i) {
              final doc = _documents[i];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.description,
                        color: Colors.amber.shade700,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            doc['fileName'],
                            style: const TextStyle(fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            doc['category'],
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.download, color: Colors.green),
                      onPressed: () {},
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildTimelineTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        // Note Input
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (v) => setState(() => _newNote = v),
                  decoration: const InputDecoration(
                    hintText: 'Write a note or comment...',
                    border: InputBorder.none,
                  ),
                  controller: TextEditingController(text: _newNote)
                    ..selection = TextSelection.collapsed(
                      offset: _newNote.length,
                    ),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  shape: const CircleBorder(),
                  padding: const EdgeInsets.all(16),
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                ),
                onPressed: _newNote.trim().isEmpty ? null : _addNote,
                child: const Icon(Icons.send, size: 20),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        // Feed
        if (_timeline.isEmpty)
          const Center(child: Text('No events exist in timeline.'))
        else
          Stack(
            children: [
              Positioned(
                left: 27,
                top: 0,
                bottom: 0,
                child: Container(width: 2, color: Colors.grey.shade200),
              ),
              Column(
                children: _timeline.map((event) {
                  IconData icon;
                  Color color;
                  final action = event['action'];
                  if (['STATUS_CHANGE', 'APPLY'].contains(action)) {
                    color = Colors.blue;
                    icon = Icons.check;
                  } else if (action == 'COMMENT') {
                    color = Colors.indigo;
                    icon = Icons.chat_bubble;
                  } else if ([
                    'INTERVIEW_SCHEDULE',
                    'CLIENT_DECISION',
                  ].contains(action)) {
                    color = Colors.green;
                    icon = Icons.event;
                  } else if (action == 'DOCUMENT_UPLOAD') {
                    color = Colors.amber;
                    icon = Icons.description;
                  } else {
                    color = Colors.grey;
                    icon = Icons.history;
                  }

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 24),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          margin: const EdgeInsets.only(left: 8),
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: Icon(icon, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 24),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      event['title'] ?? event['action'],
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      ((event['createdAt'] ?? '').toString())
                                          .split('T')
                                          .first,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  event['message'] ?? '',
                                  style: const TextStyle(
                                    color: Colors.black87,
                                    height: 1.4,
                                  ),
                                ),
                                if (event['actorUserId'] != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      'By User #${(event['actorUserId'].toString()).substring(0, 8)}',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: Colors.grey,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
      ],
    );
  }
}
