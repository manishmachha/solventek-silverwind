import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';
import 'widgets/stat_card.dart';

class SuperadminDashboard extends ConsumerStatefulWidget {
  const SuperadminDashboard({super.key});
  @override
  ConsumerState<SuperadminDashboard> createState() =>
      _SuperadminDashboardState();
}

class _SuperadminDashboardState extends ConsumerState<SuperadminDashboard> {
  bool _loading = true;
  int _activeJobs = 0,
      _totalEmployees = 0,
      _totalApps = 0,
      _pendingApprovals = 0;
  List<_ChartItem> _deptData = [], _projectData = [], _pipelineData = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiServiceProvider);
      final dashService = DashboardService(api);
      final data = await dashService.getStats();
      if (!mounted) return;
      setState(() {
        _activeJobs = data['totalActiveJobs'] ?? 0;
        _totalEmployees = data['totalEmployees'] ?? 0;
        _totalApps = data['totalApplications'] ?? 0;
        _pendingApprovals = data['pendingApprovals'] ?? 0;
        _deptData = _parseChartItems(data['employeesByDepartment']);
        _projectData = _parseChartItems(data['projectsByStatus']);
        _pipelineData = _parseChartItems(data['recruitmentPipeline']);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<_ChartItem> _parseChartItems(dynamic list) {
    if (list == null || list is! List) return [];
    return list
        .map<_ChartItem>(
          (d) => _ChartItem(d['label'] ?? '', (d['value'] ?? 0).toDouble()),
        )
        .toList();
  }

  static const _chartColors = [
    Color(0xFF6366F1),
    Color(0xFF10B981),
    Color(0xFFF59E0B),
    Color(0xFFEF4444),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
  ];

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats Grid
          _buildStatsGrid(),
          const SizedBox(height: 20),
          // Charts
          _buildChartsSection(),
          const SizedBox(height: 20),
          // Quick Actions
          _buildQuickActions(),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
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
          onTap: () => context.go('/jobs'),
        ),
        StatCard(
          label: 'Total Employees',
          value: _loading ? '—' : '$_totalEmployees',
          icon: Icons.people,
          gradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          onTap: () => context.go('/admin/employees'),
        ),
        StatCard(
          label: 'Applications',
          value: _loading ? '—' : '$_totalApps',
          icon: Icons.description,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => context.go('/applications'),
        ),
        StatCard(
          label: 'Pending Approvals',
          value: _loading ? '—' : '$_pendingApprovals',
          icon: Icons.schedule,
          gradient: const [Color(0xFFF97316), Color(0xFFEA580C)],
          onTap: () => context.go('/applications'),
        ),
      ],
    );
  }

  Widget _buildChartsSection() {
    return Column(
      children: [
        // Row of 3 charts
        SizedBox(
          height: 280,
          child: Row(
            children: [
              Expanded(
                child: _buildChartCard(
                  'Employees by Department',
                  Icons.people,
                  const Color(0xFF6366F1),
                  _buildDeptDoughnut(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildChartCard(
                  'Project Status',
                  Icons.view_kanban,
                  const Color(0xFF10B981),
                  _buildProjectPie(),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 280,
          child: _buildChartCard(
            'Recruitment Pipeline',
            Icons.filter_alt,
            const Color(0xFF8B5CF6),
            _buildPipelineBar(),
          ),
        ),
      ],
    );
  }

  Widget _buildChartCard(
    String title,
    IconData icon,
    Color iconColor,
    Widget chart,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: Color(0xFF374151),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(child: chart),
        ],
      ),
    );
  }

  Widget _buildDeptDoughnut() {
    if (_deptData.isEmpty)
      return const Center(
        child: Text('No data', style: TextStyle(color: Colors.grey)),
      );
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 30,
        sections: _deptData
            .asMap()
            .entries
            .map(
              (e) => PieChartSectionData(
                value: e.value.value,
                color: _chartColors[e.key % _chartColors.length],
                title: '${e.value.value.toInt()}',
                titleStyle: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                radius: 40,
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildProjectPie() {
    if (_projectData.isEmpty)
      return const Center(
        child: Text('No data', style: TextStyle(color: Colors.grey)),
      );
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 0,
        sections: _projectData
            .asMap()
            .entries
            .map(
              (e) => PieChartSectionData(
                value: e.value.value,
                color: _chartColors[e.key % _chartColors.length],
                title: e.value.label.length > 6
                    ? '${e.value.label.substring(0, 6)}...'
                    : e.value.label,
                titleStyle: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                radius: 50,
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildPipelineBar() {
    if (_pipelineData.isEmpty)
      return const Center(
        child: Text('No data', style: TextStyle(color: Colors.grey)),
      );
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY:
            _pipelineData.map((e) => e.value).reduce((a, b) => a > b ? a : b) *
            1.2,
        barGroups: _pipelineData
            .asMap()
            .entries
            .map(
              (e) => BarChartGroupData(
                x: e.key,
                barRods: [
                  BarChartRodData(
                    toY: e.value.value,
                    color: const Color(0xFF6366F1),
                    width: 20,
                    borderRadius: BorderRadius.circular(6),
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
                final idx = v.toInt();
                if (idx < 0 || idx >= _pipelineData.length)
                  return const SizedBox();
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _pipelineData[idx].label,
                    style: const TextStyle(fontSize: 9),
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
      ),
    );
  }

  Widget _buildQuickActions() {
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
          title: 'Manage Employees',
          subtitle: 'View & manage employees',
          icon: Icons.people,
          iconGradient: const [Color(0xFFA855F7), Color(0xFF9333EA)],
          onTap: () => context.go('/admin/employees'),
        ),
        const SizedBox(height: 10),
        QuickActionCard(
          title: 'Applications',
          subtitle: 'Review recruitment pipeline',
          icon: Icons.view_kanban,
          iconGradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => context.go('/applications'),
        ),
      ],
    );
  }
}

class _ChartItem {
  final String label;
  final double value;
  _ChartItem(this.label, this.value);
}
