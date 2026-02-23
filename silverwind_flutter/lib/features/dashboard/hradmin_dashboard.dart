import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';
import 'widgets/stat_card.dart';

class HradminDashboard extends ConsumerStatefulWidget {
  const HradminDashboard({super.key});
  @override
  ConsumerState<HradminDashboard> createState() => _HradminDashboardState();
}

class _HradminDashboardState extends ConsumerState<HradminDashboard> {
  bool _loading = true;
  int _totalEmployees = 0,
      _presentToday = 0,
      _pendingLeaves = 0,
      _assetsAssigned = 0;
  double _payrollTotal = 0;
  int _payrollProcessed = 0, _payrollPending = 0;
  List<double> _attendanceTrend = [92, 88, 95, 91, 85, 45];
  List<int> _leaveBreakdown = [24, 8, 3]; // approved, pending, rejected
  List<_ChartItem> _assetData = [];

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
        _totalEmployees = data['totalEmployees'] ?? 0;
        _assetData = _parseItems(data['assetsByType']);
        _assetsAssigned = _assetData.fold(0, (s, e) => s + e.value.toInt());
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<_ChartItem> _parseItems(dynamic list) {
    if (list == null || list is! List) return [];
    return list
        .map<_ChartItem>(
          (d) => _ChartItem(d['label'] ?? '', (d['value'] ?? 0).toDouble()),
        )
        .toList();
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
          _buildChartsRow(),
          const SizedBox(height: 20),
          _buildPayrollAndAssets(),
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
          label: 'Total Employees',
          value: _loading ? '—' : '$_totalEmployees',
          icon: Icons.people,
          gradient: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
          onTap: () => context.go('/admin/employees'),
        ),
        StatCard(
          label: 'Present Today',
          value: _loading ? '—' : '$_presentToday',
          icon: Icons.check_circle,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => context.go('/admin/attendance'),
        ),
        StatCard(
          label: 'Pending Leaves',
          value: _loading ? '—' : '$_pendingLeaves',
          icon: Icons.hourglass_top,
          gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
          onTap: () => context.go('/admin/leave-management'),
        ),
        StatCard(
          label: 'Assets Assigned',
          value: _loading ? '—' : '$_assetsAssigned',
          icon: Icons.laptop,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          onTap: () => context.go('/admin/assets'),
        ),
      ],
    );
  }

  Widget _buildChartsRow() {
    return Row(
      children: [
        Expanded(
          child: _chartCard(
            'Weekly Attendance',
            Icons.calendar_today,
            const Color(0xFF10B981),
            _buildAttendanceLine(),
            300,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _chartCard(
            'Leave Requests',
            Icons.event_busy,
            const Color(0xFFD97706),
            _buildLeaveDoughnut(),
            300,
          ),
        ),
      ],
    );
  }

  Widget _chartCard(
    String title,
    IconData icon,
    Color c,
    Widget chart,
    double h,
  ) {
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: c.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 14, color: c),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
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

  Widget _buildAttendanceLine() {
    final labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return LineChart(
      LineChartData(
        maxY: 100,
        minY: 0,
        lineBarsData: [
          LineChartBarData(
            spots: _attendanceTrend
                .asMap()
                .entries
                .map((e) => FlSpot(e.key.toDouble(), e.value))
                .toList(),
            isCurved: true,
            color: const Color(0xFF10B981),
            barWidth: 3,
            belowBarData: BarAreaData(
              show: true,
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
            ),
            dotData: const FlDotData(show: false),
          ),
        ],
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
                return i >= 0 && i < labels.length
                    ? Text(labels[i], style: const TextStyle(fontSize: 10))
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

  Widget _buildLeaveDoughnut() {
    final colors = [
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
      const Color(0xFFEF4444),
    ];
    final labels = ['Approved', 'Pending', 'Rejected'];
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 25,
        sections: _leaveBreakdown
            .asMap()
            .entries
            .map(
              (e) => PieChartSectionData(
                value: e.value.toDouble(),
                color: colors[e.key],
                title: '${e.value}',
                titleStyle: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                radius: 35,
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildPayrollAndAssets() {
    return Row(
      children: [
        Expanded(child: _buildPayrollCard()),
        const SizedBox(width: 12),
        Expanded(
          child: _chartCard(
            'Asset Distribution',
            Icons.laptop,
            const Color(0xFF3B82F6),
            _buildAssetBar(),
            240,
          ),
        ),
      ],
    );
  }

  Widget _buildPayrollCard() {
    return Container(
      height: 240,
      padding: const EdgeInsets.all(16),
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
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.account_balance_wallet,
                  size: 14,
                  color: Color(0xFF6366F1),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Payroll Status',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _payrollRow(
            'Current Month',
            '₹${_payrollTotal.toStringAsFixed(0)}',
            Colors.grey.shade50,
            Colors.grey.shade900,
          ),
          const SizedBox(height: 8),
          _payrollRow(
            'Processed',
            '$_payrollProcessed employees',
            const Color(0xFFECFDF5),
            const Color(0xFF059669),
          ),
          const SizedBox(height: 8),
          _payrollRow(
            'Pending',
            '$_payrollPending employees',
            const Color(0xFFFFFBEB),
            const Color(0xFFD97706),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => context.go('/admin/payroll'),
            child: const Row(
              children: [
                Text(
                  'View Payroll',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF6366F1),
                  ),
                ),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward, size: 14, color: Color(0xFF6366F1)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _payrollRow(String label, String value, Color bg, Color valueColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssetBar() {
    if (_assetData.isEmpty)
      return const Center(
        child: Text('No data', style: TextStyle(color: Colors.grey)),
      );
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY:
            _assetData.map((e) => e.value).reduce((a, b) => a > b ? a : b) *
            1.2,
        barGroups: _assetData
            .asMap()
            .entries
            .map(
              (e) => BarChartGroupData(
                x: e.key,
                barRods: [
                  BarChartRodData(
                    toY: e.value.value,
                    color: const Color(0xFF3B82F6),
                    width: 14,
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
                return i >= 0 && i < _assetData.length
                    ? Text(
                        _assetData[i].label,
                        style: const TextStyle(fontSize: 8),
                        overflow: TextOverflow.ellipsis,
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

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: QuickActionCard(
            title: 'Employees',
            subtitle: 'Manage users',
            icon: Icons.people,
            iconGradient: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
            onTap: () => context.go('/admin/employees'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: QuickActionCard(
            title: 'Attendance',
            subtitle: 'View records',
            icon: Icons.calendar_today,
            iconGradient: const [Color(0xFF10B981), Color(0xFF059669)],
            onTap: () => context.go('/admin/attendance'),
          ),
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
