import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';
import 'widgets/stat_card.dart';

class TaDashboard extends ConsumerStatefulWidget {
  const TaDashboard({super.key});
  @override
  ConsumerState<TaDashboard> createState() => _TaDashboardState();
}

class _TaDashboardState extends ConsumerState<TaDashboard> {
  bool _loading = true;
  int _openJobs = 0, _totalApps = 0, _inInterview = 0, _offers = 0;
  List<_FunnelStage> _funnel = [];
  List<_ChartItem> _jobsChartData = [];
  int _vendorApps = 0, _directApps = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
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

      final applied = apps.where((a) => a['status'] == 'APPLIED').length;
      final screening = apps
          .where((a) => ['SCREENING', 'SHORTLISTED'].contains(a['status']))
          .length;
      final interview = apps
          .where(
            (a) => [
              'INTERVIEW_SCHEDULED',
              'INTERVIEW_PASSED',
              'INTERVIEW_FAILED',
            ].contains(a['status']),
          )
          .length;
      final offer = apps
          .where(
            (a) => [
              'OFFER_RELEASED',
              'OFFER_ACCEPTED',
              'OFFERED',
            ].contains(a['status']),
          )
          .length;
      final hired = apps
          .where(
            (a) => [
              'ONBOARDING_IN_PROGRESS',
              'ONBOARDED',
              'CONVERTED_TO_FTE',
              'HIRED',
            ].contains(a['status']),
          )
          .length;

      // Apps by job
      final Map<String, int> appsByJob = {};
      for (final app in apps) {
        final title = app['job']?['title'] ?? 'Unknown';
        appsByJob[title] = (appsByJob[title] ?? 0) + 1;
      }
      final topJobs = appsByJob.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      _vendorApps = apps.where((a) => a['vendor'] != null).length;
      _directApps = apps.length - _vendorApps;

      if (!mounted) return;
      setState(() {
        _openJobs = jobsResult is Map
            ? (jobsResult['totalElements'] ?? jobs.length)
            : jobs.length;
        _totalApps = appsResult is Map
            ? (appsResult['totalElements'] ?? apps.length)
            : apps.length;
        _inInterview = interview;
        _offers = offer;
        _funnel = [
          _FunnelStage('Applied', applied, const Color(0xFF6366F1)),
          _FunnelStage('Screening', screening, const Color(0xFF8B5CF6)),
          _FunnelStage('Interview', interview, const Color(0xFFA855F7)),
          _FunnelStage('Offer', offer, const Color(0xFF10B981)),
          _FunnelStage('Hired', hired, const Color(0xFF059669)),
        ];
        _jobsChartData = topJobs
            .take(5)
            .map((e) => _ChartItem(e.key, e.value.toDouble()))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStats(),
          const SizedBox(height: 20),
          _buildFunnel(),
          const SizedBox(height: 20),
          _buildCharts(),
          const SizedBox(height: 20),
          _buildQuickActions(),
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
          label: 'Open Jobs',
          value: _loading ? '—' : '$_openJobs',
          icon: Icons.work,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          onTap: () => context.go('/jobs'),
        ),
        StatCard(
          label: 'Total Applications',
          value: _loading ? '—' : '$_totalApps',
          icon: Icons.person_search,
          gradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          onTap: () => context.go('/applications'),
        ),
        StatCard(
          label: 'In Interview',
          value: _loading ? '—' : '$_inInterview',
          icon: Icons.videocam,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => context.go('/applications'),
        ),
        StatCard(
          label: 'Offers Extended',
          value: _loading ? '—' : '$_offers',
          icon: Icons.emoji_events,
          gradient: const [Color(0xFFF97316), Color(0xFFEA580C)],
          onTap: () => context.go('/applications'),
        ),
      ],
    );
  }

  Widget _buildFunnel() {
    final maxCount = _funnel.isEmpty
        ? 1
        : _funnel.map((s) => s.count).reduce((a, b) => a > b ? a : b);
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
                  color: const Color(0xFFF5F3FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.filter_alt,
                  size: 16,
                  color: Color(0xFF8B5CF6),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Recruitment Funnel',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: _funnel.asMap().entries.map((e) {
              final stage = e.value;
              return Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: stage.color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${stage.count}',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: stage.color,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              stage.name,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (e.key < _funnel.length - 1)
                      Icon(
                        Icons.chevron_right,
                        color: Colors.grey.shade300,
                        size: 16,
                      ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCharts() {
    return Row(
      children: [
        Expanded(
          child: _chartCard(
            'Applications by Job',
            const Color(0xFF3B82F6),
            _buildJobsBar(),
            280,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _chartCard(
            'Candidate Sources',
            const Color(0xFF10B981),
            _buildSourceDoughnut(),
            280,
          ),
        ),
      ],
    );
  }

  Widget _chartCard(String title, Color c, Widget chart, double h) {
    return Container(
      height: h,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
          const SizedBox(height: 12),
          Expanded(child: chart),
        ],
      ),
    );
  }

  Widget _buildJobsBar() {
    if (_jobsChartData.isEmpty) return const Center(child: Text('No data'));
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY:
            _jobsChartData.map((e) => e.value).reduce((a, b) => a > b ? a : b) *
            1.2,
        barGroups: _jobsChartData
            .asMap()
            .entries
            .map(
              (e) => BarChartGroupData(
                x: e.key,
                barRods: [
                  BarChartRodData(
                    toY: e.value.value,
                    color: const Color(0xFF6366F1),
                    width: 16,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              ),
            )
            .toList(),
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) {
                int i = v.toInt();
                return i >= 0 && i < _jobsChartData.length
                    ? SizedBox(
                        width: 50,
                        child: Text(
                          _jobsChartData[i].label,
                          style: const TextStyle(fontSize: 8),
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ),
                      )
                    : const SizedBox();
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
      ),
    );
  }

  Widget _buildSourceDoughnut() {
    if (_vendorApps == 0 && _directApps == 0)
      return const Center(child: Text('No data'));
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 30,
        sections: [
          PieChartSectionData(
            value: _vendorApps.toDouble(),
            color: const Color(0xFF8B5CF6),
            title: 'Vendor',
            titleStyle: const TextStyle(
              fontSize: 10,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
            radius: 40,
          ),
          PieChartSectionData(
            value: _directApps.toDouble(),
            color: const Color(0xFF10B981),
            title: 'Direct',
            titleStyle: const TextStyle(
              fontSize: 10,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
            radius: 40,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        QuickActionCard(
          title: 'Create Job',
          subtitle: 'Post new opening',
          icon: Icons.add,
          iconGradient: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
          onTap: () => context.go('/jobs/create'),
        ),
        const SizedBox(height: 10),
        QuickActionCard(
          title: 'Pipeline',
          subtitle: 'Manage applications',
          icon: Icons.view_kanban,
          iconGradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          onTap: () => context.go('/applications'),
        ),
        const SizedBox(height: 10),
        QuickActionCard(
          title: 'All Jobs',
          subtitle: 'View & manage jobs',
          icon: Icons.work,
          iconGradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => context.go('/jobs'),
        ),
      ],
    );
  }
}

class _FunnelStage {
  final String name;
  final int count;
  final Color color;
  _FunnelStage(this.name, this.count, this.color);
}

class _ChartItem {
  final String label;
  final double value;
  _ChartItem(this.label, this.value);
}
