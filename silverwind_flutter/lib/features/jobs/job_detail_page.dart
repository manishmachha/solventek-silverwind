import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/domain_services.dart';

/// Job Detail page matching Angular's JobDetailComponent (867L).
/// Gradient header, 2-column layout, actions sidebar, compensation card, modals.
class JobDetailPage extends ConsumerStatefulWidget {
  final String id;
  const JobDetailPage({super.key, required this.id});
  @override
  ConsumerState<JobDetailPage> createState() => _JobDetailPageState();
}

class _JobDetailPageState extends ConsumerState<JobDetailPage> {
  Map<String, dynamic>? _job;
  bool _loading = true;
  bool _showEnrich = false;
  bool _showFinalVerify = false;
  bool _showUpdateStatus = false;

  // Enrich form
  final _enrichSkills = TextEditingController();
  final _enrichExp = TextEditingController();
  final _enrichReq = TextEditingController();
  final _enrichRoles = TextEditingController();

  // Final verify
  final _fvBillRate = TextEditingController();
  final _fvPayRate = TextEditingController();

  // Update status
  String _newStatus = 'DRAFT';
  final _statusMsg = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadJob();
  }

  @override
  void dispose() {
    for (final c in [
      _enrichSkills,
      _enrichExp,
      _enrichReq,
      _enrichRoles,
      _fvBillRate,
      _fvPayRate,
      _statusMsg,
    ])
      c.dispose();
    super.dispose();
  }

  String get _role => ref.read(authProvider).user?.role.name ?? '';
  String get _orgType => ref.read(authProvider).user?.orgType ?? '';
  bool get _canManage => _role != 'EMPLOYEE' && _orgType == 'SOLVENTEK';
  bool get _canCritical => _canManage && _role != 'TA';

  Future<void> _loadJob() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(jobServiceProvider);
      final data = await svc.getJob(widget.id);
      if (mounted)
        setState(() {
          _job = data;
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    try {
      final svc = ref.read(jobServiceProvider);
      await svc.updateStatus(widget.id, 'ADMIN_VERIFIED');
      _loadJob();
    } catch (_) {}
  }

  Future<void> _publish() async {
    try {
      final svc = ref.read(jobServiceProvider);
      await svc.updateStatus(widget.id, 'PUBLISHED');
      _loadJob();
    } catch (_) {}
  }

  Future<void> _enrich() async {
    try {
      final svc = ref.read(jobServiceProvider);
      await svc.updateJob(widget.id, {
        'skills': _enrichSkills.text,
        'experience': _enrichExp.text,
        'requirements': _enrichReq.text,
        'rolesAndResponsibilities': _enrichRoles.text,
        'status': 'TA_ENRICHED',
      });
      setState(() => _showEnrich = false);
      _loadJob();
    } catch (_) {}
  }

  Future<void> _finalVerify() async {
    try {
      final svc = ref.read(jobServiceProvider);
      await svc.updateJob(widget.id, {
        'billRate': double.tryParse(_fvBillRate.text),
        'payRate': double.tryParse(_fvPayRate.text),
        'status': 'ADMIN_FINAL_VERIFIED',
      });
      setState(() => _showFinalVerify = false);
      _loadJob();
    } catch (_) {}
  }

  Future<void> _updateStatus() async {
    try {
      final svc = ref.read(jobServiceProvider);
      await svc.updateStatus(
        widget.id,
        _newStatus,
        message: _statusMsg.text.isNotEmpty ? _statusMsg.text : null,
      );
      setState(() => _showUpdateStatus = false);
      _loadJob();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_job == null)
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.grey.shade300),
              const SizedBox(height: 12),
              const Text('Job not found'),
              TextButton(
                onPressed: () => context.go('/jobs'),
                child: const Text('Back to Jobs'),
              ),
            ],
          ),
        ),
      );

    final j = _job!;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _loadJob,
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildHeader(j),
                _buildQuickStats(j),
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: LayoutBuilder(
                    builder: (ctx, constraints) {
                      final wide = constraints.maxWidth > 800;
                      if (wide) {
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 2, child: _buildLeftColumn(j)),
                            const SizedBox(width: 20),
                            SizedBox(width: 300, child: _buildRightColumn(j)),
                          ],
                        );
                      }
                      return Column(
                        children: [
                          _buildLeftColumn(j),
                          const SizedBox(height: 16),
                          _buildRightColumn(j),
                        ],
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          if (_showEnrich) _enrichModal(),
          if (_showFinalVerify) _finalVerifyModal(),
          if (_showUpdateStatus) _updateStatusModal(),
        ],
      ),
    );
  }

  Widget _buildHeader(Map<String, dynamic> j) {
    final title = j['title'] ?? '';
    final orgName = j['organization']?['name'] ?? 'Internal';
    final location = j['location'] ?? 'Remote';
    final status = j['status'] ?? 'DRAFT';
    final empType = (j['employmentType'] ?? '').toString().replaceAll('_', ' ');
    final experience = j['experience'] ?? '';

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Back button
              GestureDetector(
                onTap: () => context.go('/jobs'),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.arrow_back,
                      color: Colors.white70,
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Back to Jobs',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                orgName,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_outlined,
                                  size: 14,
                                  color: Colors.white60,
                                ),
                                const SizedBox(width: 2),
                                Text(
                                  location,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.white60,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 16,
                          children: [
                            if (empType.isNotEmpty)
                              _headerInfo(Icons.work_outline, empType),
                            if (experience.isNotEmpty)
                              _headerInfo(Icons.access_time, experience),
                          ],
                        ),
                      ],
                    ),
                  ),
                  _statusBadgeLarge(status),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _headerInfo(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.white60),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 13, color: Colors.white70)),
      ],
    );
  }

  Widget _statusBadgeLarge(String status) {
    final colors = _statusColors(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: colors[0],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors[0]),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: colors[1],
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildQuickStats(Map<String, dynamic> j) {
    final billRate = j['billRate'];
    final payRate = j['payRate'];
    final skills = j['skills'] ?? '';
    final skillCount = skills.isNotEmpty
        ? skills.toString().split(',').length
        : 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      color: const Color(0xFFFAFAFB),
      child: Wrap(
        spacing: 24,
        runSpacing: 12,
        children: [
          if (billRate != null)
            _statChip(
              'Bill Rate',
              '\$$billRate/hr',
              Icons.attach_money,
              const Color(0xFF10B981),
              const Color(0xFFDCFCE7),
            ),
          if (payRate != null)
            _statChip(
              'Pay Rate',
              '\$$payRate/hr',
              Icons.account_balance_wallet,
              const Color(0xFF3B82F6),
              const Color(0xFFDBEAFE),
            ),
          if (skillCount > 0)
            _statChip(
              'Skills',
              '$skillCount required',
              Icons.bolt,
              const Color(0xFF8B5CF6),
              const Color(0xFFF3E8FF),
            ),
        ],
      ),
    );
  }

  Widget _statChip(
    String label,
    String value,
    IconData icon,
    Color color,
    Color bg,
  ) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLeftColumn(Map<String, dynamic> j) {
    return Column(
      children: [
        _detailCard(
          'Job Description',
          Icons.description,
          const Color(0xFF6366F1),
          j['description'] ?? 'No description provided.',
        ),
        if (j['requirements'] != null &&
            j['requirements'].toString().isNotEmpty) ...[
          const SizedBox(height: 16),
          _detailCard(
            'Requirements',
            Icons.checklist,
            const Color(0xFF10B981),
            j['requirements'],
          ),
        ],
        if (j['rolesAndResponsibilities'] != null &&
            j['rolesAndResponsibilities'].toString().isNotEmpty) ...[
          const SizedBox(height: 16),
          _detailCard(
            'Roles & Responsibilities',
            Icons.badge,
            const Color(0xFFF59E0B),
            j['rolesAndResponsibilities'],
          ),
        ],
        if (j['skills'] != null && j['skills'].toString().isNotEmpty) ...[
          const SizedBox(height: 16),
          _skillsCard(j['skills']),
        ],
      ],
    );
  }

  Widget _detailCard(
    String title,
    IconData icon,
    Color iconColor,
    String content,
  ) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: iconColor),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              content,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _skillsCard(String skills) {
    final list = skills
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
            ),
            child: const Row(
              children: [
                Icon(Icons.star, size: 18, color: Color(0xFF8B5CF6)),
                SizedBox(width: 8),
                Text(
                  'Required Skills',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: list
                  .map(
                    (s) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFEEF2FF), Color(0xFFF5F3FF)],
                        ),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFC7D2FE)),
                      ),
                      child: Text(
                        s,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF4338CA),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRightColumn(Map<String, dynamic> j) {
    final status = j['status'] ?? '';
    return Column(
      children: [
        // Actions Card
        _sideCard('ACTIONS', [
          if (_canCritical && (status == 'SUBMITTED' || status == 'DRAFT'))
            _actionBtn(
              'Verify Job',
              Icons.check_circle,
              const Color(0xFF4F46E5),
              _verify,
            ),
          if (_canManage && status == 'ADMIN_VERIFIED')
            _actionBtn(
              'Enrich Job',
              Icons.auto_fix_high,
              const Color(0xFF7C3AED),
              () {
                _enrichSkills.text = j['skills'] ?? '';
                _enrichExp.text = j['experience'] ?? '';
                _enrichReq.text = j['requirements'] ?? '';
                _enrichRoles.text = j['rolesAndResponsibilities'] ?? '';
                setState(() => _showEnrich = true);
              },
            ),
          if (_canCritical &&
              (status == 'TA_ENRICHED' || status == 'ADMIN_VERIFIED'))
            _actionBtn(
              'Final Verify & Rates',
              Icons.monetization_on,
              const Color(0xFF059669),
              () => setState(() => _showFinalVerify = true),
            ),
          if (_canCritical && status == 'ADMIN_FINAL_VERIFIED')
            _actionBtn(
              'Publish Job',
              Icons.public,
              const Color(0xFF2563EB),
              _publish,
            ),
          if (_canManage) ...[
            _outlineBtn(
              'Edit Job',
              Icons.edit,
              () => context.go('/jobs/edit/${widget.id}'),
            ),
            _outlineBtn(
              'Update Status',
              Icons.sync,
              () => setState(() {
                _newStatus = status;
                _showUpdateStatus = true;
              }),
            ),
          ],
          if (_canCritical) _dangerBtn('Delete Job', Icons.delete, () {}),
        ]),
        const SizedBox(height: 16),
        // Info Card
        _sideCard('JOB INFORMATION', [
          _infoRow('Job ID', '${widget.id.substring(0, 8)}...'),
          _infoRow(
            'Employment Type',
            (j['employmentType'] ?? 'N/A').toString().replaceAll('_', ' '),
          ),
          if (j['experience'] != null) _infoRow('Experience', j['experience']),
          _infoRow('Created', j['createdAt'] ?? 'N/A'),
        ]),
        // Compensation Card (admin only)
        if (_canCritical &&
            (j['billRate'] != null || j['payRate'] != null)) ...[
          const SizedBox(height: 16),
          _compensationCard(j),
        ],
      ],
    );
  }

  Widget _sideCard(String title, List<Widget> children) {
    final hasContent = children.where((w) => w is! SizedBox).isNotEmpty;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Color(0xFF111827),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: hasContent
                ? Column(children: children)
                : Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        'No actions available',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _actionBtn(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: onTap,
          icon: Icon(icon, size: 16),
          label: Text(label),
          style: ElevatedButton.styleFrom(
            backgroundColor: color,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
        ),
      ),
    );
  }

  Widget _outlineBtn(String label, IconData icon, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: onTap,
          icon: Icon(icon, size: 16),
          label: Text(label),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
    );
  }

  Widget _dangerBtn(String label, IconData icon, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: onTap,
          icon: Icon(icon, size: 16),
          label: Text(label),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFEF2F2),
            foregroundColor: const Color(0xFFDC2626),
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFFECACA)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }

  Widget _compensationCard(Map<String, dynamic> j) {
    final bill = j['billRate'];
    final pay = j['payRate'];
    final margin = (bill != null && pay != null) ? (bill - pay) : null;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              border: Border(
                bottom: BorderSide(color: const Color(0xFFBBF7D0)),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.attach_money,
                  size: 18,
                  color: Color(0xFF16A34A),
                ),
                const SizedBox(width: 8),
                const Text(
                  'COMPENSATION',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (bill != null)
                  _compRow('Bill Rate', '\$$bill/hr', const Color(0xFF16A34A)),
                if (pay != null)
                  _compRow('Pay Rate', '\$$pay/hr', const Color(0xFF2563EB)),
                if (margin != null) ...[
                  Divider(color: Colors.grey.shade100),
                  _compRow(
                    'Margin',
                    '\$${margin.toStringAsFixed(2)}/hr',
                    const Color(0xFFD97706),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _compRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  List<Color> _statusColors(String s) {
    switch (s) {
      case 'PUBLISHED':
        return [const Color(0xFFDCFCE7), const Color(0xFF166534)];
      case 'SUBMITTED':
        return [const Color(0xFFFEF3C7), const Color(0xFF92400E)];
      case 'ADMIN_VERIFIED':
        return [const Color(0xFFDBEAFE), const Color(0xFF1E40AF)];
      case 'TA_ENRICHED':
        return [const Color(0xFFF3E8FF), const Color(0xFF6B21A8)];
      case 'ADMIN_FINAL_VERIFIED':
        return [const Color(0xFFE0F2FE), const Color(0xFF0369A1)];
      case 'CLOSED':
        return [const Color(0xFFFEE2E2), const Color(0xFF991B1B)];
      default:
        return [const Color(0xFFF3F4F6), const Color(0xFF374151)];
    }
  }

  // --- Modals ---
  Widget _enrichModal() => _modal(
    'Enrich Job Details',
    const Color(0xFF7C3AED),
    Icons.auto_fix_high,
    [
      _modalField('Skills (comma separated)', _enrichSkills),
      _modalField('Experience Required', _enrichExp),
      _modalField('Detailed Requirements', _enrichReq, maxLines: 4),
      _modalField('Roles & Responsibilities', _enrichRoles, maxLines: 4),
    ],
    () => _enrich(),
    () => setState(() => _showEnrich = false),
  );

  Widget _finalVerifyModal() => _modal(
    'Final Verification',
    const Color(0xFF059669),
    Icons.monetization_on,
    [
      _modalField(
        'Bill Rate (\$/hr)',
        _fvBillRate,
        keyboardType: TextInputType.number,
      ),
      _modalField(
        'Pay Rate (\$/hr)',
        _fvPayRate,
        keyboardType: TextInputType.number,
      ),
    ],
    () => _finalVerify(),
    () => setState(() => _showFinalVerify = false),
  );

  Widget _updateStatusModal() => _modal(
    'Update Job Status',
    const Color(0xFF6366F1),
    Icons.sync,
    [
      DropdownButtonFormField<String>(
        value: _newStatus,
        decoration: _modalDecor('New Status'),
        items:
            [
                  'DRAFT',
                  'SUBMITTED',
                  'ADMIN_VERIFIED',
                  'TA_ENRICHED',
                  'ADMIN_FINAL_VERIFIED',
                  'PUBLISHED',
                  'CLOSED',
                ]
                .map(
                  (s) => DropdownMenuItem(
                    value: s,
                    child: Text(
                      s.replaceAll('_', ' '),
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                )
                .toList(),
        onChanged: (v) => setState(() => _newStatus = v ?? 'DRAFT'),
      ),
      const SizedBox(height: 12),
      _modalField('Message (Optional)', _statusMsg, maxLines: 3),
    ],
    () => _updateStatus(),
    () => setState(() => _showUpdateStatus = false),
  );

  Widget _modal(
    String title,
    Color color,
    IconData icon,
    List<Widget> fields,
    VoidCallback onSubmit,
    VoidCallback onCancel,
  ) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          width: 500,
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ...fields,
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: onCancel, child: const Text('Cancel')),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: onSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: const Text('Submit'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modalField(
    String label,
    TextEditingController ctrl, {
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboardType,
        decoration: _modalDecor(label),
      ),
    );
  }

  InputDecoration _modalDecor(String label) => InputDecoration(
    labelText: label,
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade200),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade200),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );
}
