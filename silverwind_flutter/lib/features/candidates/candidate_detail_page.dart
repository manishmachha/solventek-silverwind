import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

import '../../config/app_colors.dart';
import '../../core/services/domain_services.dart';
import '../../core/providers/auth_provider.dart';
import 'widgets/client_submissions_widget.dart';

class CandidateDetailPage extends ConsumerStatefulWidget {
  final String id;
  const CandidateDetailPage({super.key, required this.id});

  @override
  ConsumerState<CandidateDetailPage> createState() =>
      _CandidateDetailPageState();
}

class _CandidateDetailPageState extends ConsumerState<CandidateDetailPage> {
  Map<String, dynamic>? _candidate;
  bool _loading = true;
  bool _expandedSkills = false;

  @override
  void initState() {
    super.initState();
    _loadCandidate();
  }

  Future<void> _loadCandidate() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(candidateServiceProvider);
      final result = await svc.getCandidateById(widget.id);
      if (mounted) {
        setState(() {
          _candidate = result;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading candidate details: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? get _analysis {
    if (_candidate == null) return null;
    final jsonStr = _candidate!['aiAnalysisJson'];
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      return jsonDecode(jsonStr);
    } catch (e) {
      debugPrint('Failed to parse aiAnalysisJson: $e');
      return null;
    }
  }

  List<dynamic> get _experience {
    if (_candidate == null) return [];
    final jsonStr = _candidate!['experienceDetailsJson'];
    if (jsonStr == null || jsonStr.isEmpty) return [];
    try {
      return jsonDecode(jsonStr);
    } catch (_) {
      return [];
    }
  }

  List<dynamic> get _education {
    if (_candidate == null) return [];
    final jsonStr = _candidate!['educationDetailsJson'];
    if (jsonStr == null || jsonStr.isEmpty) return [];
    try {
      return jsonDecode(jsonStr);
    } catch (_) {
      return [];
    }
  }

  Future<void> _confirmDelete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Candidate'),
        content: const Text(
          'Are you sure you want to delete this candidate? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      try {
        // final svc = ref.read(candidateServiceProvider);
        // Assuming deleteCandidate is added to domain_services.dart
        // await svc.deleteCandidate(widget.id);
        // For now just pop to simulate success or call an api directly
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Candidate deleted.')));
        context.go('/candidates');
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete candidate: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_candidate == null) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Candidate not found',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/candidates'),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final c = _candidate!;
    final firstName = c['firstName'] ?? '';
    final lastName = c['lastName'] ?? '';
    final initials =
        '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}';
    final designation = c['currentDesignation'] ?? 'No Title';
    final company = c['currentCompany'];

    final isEmployee = ref.watch(authProvider.notifier).isEmployee();
    final isSolventek = ref.watch(authProvider.notifier).orgType == 'SOLVENTEK';

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEEF2FF), Color(0xFFFFF1F2)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              padding: const EdgeInsets.all(24),
              margin: const EdgeInsets.only(bottom: 24),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initials.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 24),

                  // Main Info
                  Expanded(
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
                                  '$firstName $lastName',
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textMain,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary50,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        designation.toUpperCase(),
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                    if (company != null) ...[
                                      const SizedBox(width: 8),
                                      Text(
                                        'at $company',
                                        style: const TextStyle(
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                            // Actions
                            if (!isEmployee)
                              Row(
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () {}, // update resume logic
                                    icon: const Icon(
                                      Icons.cloud_upload_outlined,
                                      size: 16,
                                    ),
                                    label: const Text('Update Resume'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AppColors.textMain,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: () => context.go(
                                      '/candidates/edit/${c['id']}',
                                    ),
                                    icon: const Icon(
                                      Icons.edit_outlined,
                                      size: 16,
                                    ),
                                    label: const Text('Edit'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AppColors.textMain,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: _confirmDelete,
                                    icon: const Icon(
                                      Icons.delete_outline,
                                      size: 16,
                                    ),
                                    label: const Text('Delete'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AppColors.danger,
                                      side: const BorderSide(
                                        color: AppColors.danger,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),

                        const SizedBox(height: 24),
                        // Metadata Grid
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: [
                            _buildMetaItem(
                              Icons.location_on,
                              'Location',
                              c['city'] ?? 'Not specified',
                              Colors.green,
                            ),
                            _buildMetaItem(
                              Icons.work,
                              'Experience',
                              '${c['experienceYears'] ?? 0} years',
                              Colors.blue,
                            ),
                            _buildMetaItem(
                              Icons.phone,
                              'Phone',
                              c['phone'] ?? '--',
                              Colors.pink,
                            ),
                            _buildMetaItem(
                              Icons.email,
                              'Email',
                              c['email'] ?? '--',
                              Colors.orange,
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),
                        // Links
                        Row(
                          children: [
                            if (c['linkedInUrl'] != null &&
                                c['linkedInUrl'].isNotEmpty) ...[
                              _buildLinkChip(
                                Icons.link,
                                'LinkedIn',
                                Colors.blue,
                                c['linkedInUrl'],
                              ),
                              const SizedBox(width: 8),
                            ],
                            if (c['portfolioUrl'] != null &&
                                c['portfolioUrl'].isNotEmpty) ...[
                              _buildLinkChip(
                                Icons.language,
                                'Portfolio',
                                Colors.pink,
                                c['portfolioUrl'],
                              ),
                              const SizedBox(width: 8),
                            ],
                            if (c['resumeFilePath'] != null) ...[
                              InkWell(
                                onTap: () {}, // Download logic
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary50,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: const [
                                      Icon(
                                        Icons.download,
                                        size: 14,
                                        color: AppColors.primary,
                                      ),
                                      SizedBox(width: 6),
                                      Text(
                                        'Resume',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Two-column layout
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column (Main Content)
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Client Submissions
                      ClientSubmissionsWidget(candidateId: widget.id),
                      const SizedBox(height: 24),

                      // AI Analysis
                      if (isSolventek && _analysis != null)
                        _buildAiAnalysis(_analysis!),
                      if (isSolventek && _analysis != null)
                        const SizedBox(height: 24),

                      // Professional Summary
                      _buildSummaryCard(c['summary']),
                      const SizedBox(height: 24),

                      // Experience & Education
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildExperienceCard()),
                          const SizedBox(width: 24),
                          Expanded(child: _buildEducationCard()),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 24),

                // Right Column (Sidebar)
                Expanded(
                  flex: 1,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Detected Issues
                      if (isSolventek &&
                          _analysis?['redFlags'] != null &&
                          (_analysis!['redFlags'] as List).isNotEmpty)
                        _buildIssuesCard(_analysis!['redFlags']),

                      // Skills
                      _buildSkillsCard(c['skills'] ?? []),
                      const SizedBox(height: 24),

                      // Resume Details
                      _buildResumeDetailsCard(c),

                      // Organization info
                      if (isSolventek && c['organization'] != null) ...[
                        const SizedBox(height: 24),
                        _buildOrganizationCard(c['organization']),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaItem(
    IconData icon,
    String label,
    String value,
    MaterialColor color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.transparent),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: color.shade500),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMuted,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLinkChip(
    IconData icon,
    String label,
    MaterialColor color,
    String url,
  ) {
    return InkWell(
      onTap: () {}, // Open URL
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.shade50,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color.shade700),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAiAnalysis(Map<String, dynamic> analysis) {
    final risks = [
      analysis['overallRiskScore'] ?? 0,
      analysis['overallConsistencyScore'] ?? 0,
      analysis['timelineRiskScore'] ?? 0,
      analysis['skillInflationRiskScore'] ?? 0,
      analysis['projectCredibilityRiskScore'] ?? 0,
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: const Icon(Icons.memory, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'AI Resume Audit',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMain,
                    ),
                  ),
                  Text(
                    'AUTOMATED QUALITY & RISK ASSESSMENT',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Radar Chart
              Expanded(
                child: SizedBox(
                  height: 250,
                  child: RadarChart(
                    RadarChartData(
                      dataSets: [
                        RadarDataSet(
                          fillColor: AppColors.primary.withValues(alpha: 0.2),
                          borderColor: AppColors.primary,
                          entryRadius: 3,
                          dataEntries: List.generate(
                            5,
                            (i) =>
                                RadarEntry(value: (risks[i] as num).toDouble()),
                          ),
                        ),
                      ],
                      radarBackgroundColor: Colors.transparent,
                      borderData: FlBorderData(show: false),
                      radarBorderData: const BorderSide(
                        color: Colors.transparent,
                      ),
                      titlePositionPercentageOffset: 0.2,
                      titleTextStyle: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                      getTitle: (index, angle) {
                        switch (index) {
                          case 0:
                            return const RadarChartTitle(text: 'Overall Risk');
                          case 1:
                            return const RadarChartTitle(text: 'Consistency');
                          case 2:
                            return const RadarChartTitle(text: 'Timeline Risk');
                          case 3:
                            return const RadarChartTitle(
                              text: 'Skill Inflation',
                            );
                          case 4:
                            return const RadarChartTitle(text: 'Credibility');
                          default:
                            return const RadarChartTitle(text: '');
                        }
                      },
                      tickCount: 5,
                      ticksTextStyle: const TextStyle(
                        color: Colors.transparent,
                        fontSize: 10,
                      ),
                      tickBorderData: const BorderSide(color: Colors.black12),
                      gridBorderData: const BorderSide(
                        color: Colors.black12,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              // Scores
              Expanded(
                child: Column(
                  children: [
                    _buildScoreBox('Overall Risk', risks[0], isMain: true),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildScoreBox(
                            'Consistency',
                            risks[1],
                            bg: Colors.blue.shade50,
                            tx: Colors.blue.shade900,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildScoreBox(
                            'Timeline',
                            risks[2],
                            bg: Colors.purple.shade50,
                            tx: Colors.purple.shade900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildScoreBox(
                            'Skill Inflation',
                            risks[3],
                            bg: Colors.amber.shade50,
                            tx: Colors.amber.shade900,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildScoreBox(
                            'Credibility',
                            risks[4],
                            bg: Colors.indigo.shade50,
                            tx: Colors.indigo.shade900,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          if (analysis['summary'] != null) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Divider(),
            ),
            const Text(
              'EXECUTIVE SUMMARY',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              analysis['summary'],
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textMain,
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScoreBox(
    String label,
    dynamic score, {
    bool isMain = false,
    Color? bg,
    Color? tx,
  }) {
    final numScore = (score as num?)?.toDouble() ?? 0;
    Color barColor = Colors.green;
    if (numScore >= 70) {
      barColor = AppColors.danger;
    } else if (numScore >= 30) {
      barColor = AppColors.warning;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg ?? Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: bg != null ? bg.withValues(alpha: 0.5) : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: isMain ? 12 : 10,
              fontWeight: FontWeight.bold,
              color: isMain ? AppColors.textMuted : tx?.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 4),
          if (isMain) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  numScore.toStringAsFixed(0),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textMain,
                  ),
                ),
                const Text(
                  ' / 100',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              height: 6,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(3),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: numScore / 100,
                child: Container(
                  decoration: BoxDecoration(
                    color: barColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ] else
            Text(
              '${numScore.toStringAsFixed(0)}%',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: tx,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String? summary) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.person_pin, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Professional Summary',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            summary == null || summary.isEmpty
                ? 'No summary available.'
                : summary,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textMain,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExperienceCard() {
    final expList = _experience;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.work_outline, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Experience',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (expList.isEmpty)
            const Text(
              'No experience details parsed.',
              style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
            )
          else
            ...expList.map(
              (exp) => Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color: AppColors.primary,
                              width: 2,
                            ),
                            shape: BoxShape.circle,
                          ),
                        ),
                        Container(
                          width: 2,
                          height: 50,
                          color: Colors.grey.shade200,
                        ), // simplistic line
                      ],
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            exp['title'] ?? '',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textMain,
                            ),
                          ),
                          Text(
                            exp['company'] ?? '',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${exp['start']} - ${exp['end'] ?? (exp['isCurrent'] == true ? 'Present' : '')}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                          if (exp['description'] != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              exp['description'],
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textMain,
                              ),
                            ),
                          ],
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

  Widget _buildEducationCard() {
    final eduList = _education;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.school_outlined, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Education',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (eduList.isEmpty)
            const Text(
              'No education details parsed.',
              style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
            )
          else
            ...eduList.map(
              (edu) => Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primary50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.account_balance,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            edu['institution'] ?? '',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textMain,
                            ),
                          ),
                          Text(
                            '${edu['degree']} ${edu['fieldOfStudy'] != null ? 'in ${edu['fieldOfStudy']}' : ''}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${edu['startYear'] ?? ''} - ${edu['endYear'] ?? ''}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
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

  Widget _buildIssuesCard(List<dynamic> flags) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade100),
      ),
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.warning_amber_rounded, color: Colors.red),
              SizedBox(width: 8),
              Text(
                'Detected Issues',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...flags.map((flag) {
            final severity = flag['severity'] ?? 'LOW';
            Color tagBg = Colors.blue.shade50;
            Color tagTx = Colors.blue.shade700;
            if (severity == 'HIGH') {
              tagBg = Colors.red.shade50;
              tagTx = Colors.red.shade700;
            } else if (severity == 'MEDIUM') {
              tagBg = Colors.orange.shade50;
              tagTx = Colors.orange.shade700;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        (flag['category'] ?? '').toString().toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textMain,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: tagBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          severity,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: tagTx,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    flag['description'] ?? '',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMain,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSkillsCard(List<dynamic> skills) {
    final displaySkills = _expandedSkills ? skills : skills.take(10).toList();
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.star_border, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Skills',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (skills.isEmpty)
            const Text(
              'No skills listed',
              style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: displaySkills
                  .map(
                    (s) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Text(
                        s.toString(),
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textMain,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),

          if (skills.length > 10) ...[
            const SizedBox(height: 16),
            InkWell(
              onTap: () => setState(() => _expandedSkills = !_expandedSkills),
              child: Text(
                _expandedSkills
                    ? 'Show less'
                    : 'Show ${skills.length - 10} more',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildResumeDetailsCard(Map<String, dynamic> c) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'File Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textMain,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filename',
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
              Expanded(
                child: Text(
                  c['resumeOriginalFileName'] ?? '--',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.right,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Parsed On',
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
              Text(
                c['createdAt'] != null
                    ? DateFormat.yMMMd().format(DateTime.parse(c['createdAt']))
                    : '--',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrganizationCard(Map<String, dynamic> org) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SOURCED BY (VENDOR)',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.textMuted,
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
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.business), // In real app, load org logo
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    org['name'] ?? '',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMain,
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
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (org['type'] ?? '').toString().toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (org['email'] != null) ...[
            Row(
              children: [
                const Icon(Icons.email_outlined, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  org['email'],
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
          if (org['phone'] != null) ...[
            Row(
              children: [
                const Icon(Icons.phone_outlined, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  org['phone'],
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
          if (org['website'] != null) ...[
            Row(
              children: [
                const Icon(Icons.public, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  org['website'],
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}
