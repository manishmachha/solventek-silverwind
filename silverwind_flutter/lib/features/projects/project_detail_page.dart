import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_colors.dart';
import '../../config/app_constants.dart';
import '../../core/services/domain_services.dart';

class ProjectDetailPage extends ConsumerStatefulWidget {
  final String id;
  const ProjectDetailPage({super.key, required this.id});
  @override
  ConsumerState<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends ConsumerState<ProjectDetailPage> {
  Map<String, dynamic> _data = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final svc = ref.read(projectServiceProvider);
      final result = await svc.getProjectById(widget.id);
      if (mounted) setState(() { _data = result as Map<String, dynamic>; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _data['firstName'] != null ? '${_data['firstName']} ${_data['lastName'] ?? ''}'
                : _data['title'] ?? _data['name'] ?? _data['subject'] ?? 'Project Details';
    final status = _data['status'] as String? ?? _data['employmentStatus'] as String?;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: _loading
        ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
        : SingleChildScrollView(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Back + Header
              Row(children: [
                IconButton(
                  onPressed: () => context.canPop() ? context.pop() : context.go('/dashboard'),
                  icon: const Icon(Icons.arrow_back, color: AppColors.textMuted),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(gradient: AppColors.gradientPrimary, borderRadius: BorderRadius.circular(14)),
                  child: Icon(Icons.view_kanban, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name.toString(), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textMain)),
                  if (status != null) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(color: _getStatusColor(status).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                      child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _getStatusColor(status))),
                    ),
                  ],
                ])),
              ]),
              const SizedBox(height: 24),

              // Detail Cards
              ..._buildDetailSections(),
            ]),
          ),
    );
  }

  List<Widget> _buildDetailSections() {
    final sections = <Widget>[];
    final generalFields = <String, dynamic>{};
    final metaFields = <String, dynamic>{};

    _data.forEach((key, value) {
      if (value == null || value.toString().isEmpty) return;
      if (value is Map || value is List) return;
      if (['id', 'orgId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].contains(key)) {
        metaFields[key] = value;
      } else {
        generalFields[key] = value;
      }
    });

    if (generalFields.isNotEmpty) {
      sections.add(_buildSection('Details', Icons.info_outline, generalFields));
    }

    // Nested objects
    _data.forEach((key, value) {
      if (value is Map<String, dynamic>) {
        sections.add(Padding(padding: const EdgeInsets.only(top: 16), child: _buildSection(_formatKey(key), Icons.folder_outlined, value)));
      }
    });

    if (metaFields.isNotEmpty) {
      sections.add(Padding(padding: const EdgeInsets.only(top: 16), child: _buildSection('Metadata', Icons.access_time, metaFields)));
    }

    return sections;
  }

  Widget _buildSection(String title, IconData icon, Map<String, dynamic> fields) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surface200), boxShadow: AppConstants.shadowCard),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textMain)),
        ]),
        const SizedBox(height: 16),
        ...fields.entries.map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 160, child: Text(_formatKey(e.key), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMuted))),
            Expanded(child: Text(e.value.toString(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMain))),
          ]),
        )),
      ]),
    );
  }

  String _formatKey(String key) {
    return key.replaceAllMapped(RegExp(r'[A-Z]'), (m) => ' ${m.group(0)}')
      .split(' ').map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '').join(' ').trim();
  }

  Color _getStatusColor(String status) {
    final s = status.toUpperCase();
    if (s.contains('ACTIVE') || s.contains('APPROVED') || s.contains('PUBLISHED')) return AppColors.success;
    if (s.contains('PENDING') || s.contains('REVIEW') || s.contains('DRAFT')) return AppColors.warning;
    if (s.contains('REJECTED') || s.contains('INACTIVE') || s.contains('CLOSED')) return AppColors.danger;
    return AppColors.info;
  }
}
