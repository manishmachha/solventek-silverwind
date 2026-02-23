import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_colors.dart';
import '../../config/app_constants.dart';
import '../../core/services/domain_services.dart';

class MyLeavesPage extends ConsumerStatefulWidget {
  const MyLeavesPage({super.key});
  @override
  ConsumerState<MyLeavesPage> createState() => _MyLeavesPageState();
}

class _MyLeavesPageState extends ConsumerState<MyLeavesPage> {
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(leaveServiceProvider);
      final result = await svc.getMyLeaves();
      if (mounted) {
        setState(() {
          _items = result is List ? result : [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _items = []; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(gradient: AppColors.gradientPrimary, borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))]),
            child: Icon(Icons.event_busy, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('My Leaves', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.textMain)),
            Text('${_items.length} leaves', style: const TextStyle(fontSize: 14, color: AppColors.textMuted)),
          ])),
          IconButton(onPressed: _loadData, icon: const Icon(Icons.refresh)),
        ]),
        const SizedBox(height: 20),
        Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
          : _items.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.inbox_outlined, size: 64, color: AppColors.textLight),
                const SizedBox(height: 16),
                Text('No leaves found', style: TextStyle(fontSize: 16, color: AppColors.textMuted)),
              ]))
            : Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.surface200), boxShadow: AppConstants.shadowCard),
                child: ListView.separated(
                  itemCount: _items.length,
                  separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.surface200),
                  itemBuilder: (context, index) {
                    final item = _items[index];
                    if (item is! Map<String, dynamic>) return const SizedBox();
                    final name = item['name'] ?? item['title'] ?? item['subject'] ?? item['assetType'] ?? item['type'] ?? 'Item';
                    final sub = item['description'] ?? item['status'] ?? item['date'] ?? item['month'] ?? '';
                    final status = item['status'] as String?;
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary50,
                        child: Text(name.toString()[0].toUpperCase(), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                      ),
                      title: Text(name.toString(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      subtitle: Text(sub.toString(), style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      trailing: status != null ? Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _statusColor(status).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20)),
                        child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(status))),
                      ) : null,
                    );
                  },
                ),
              ),
        ),
      ]),
    );
  }

  Color _statusColor(String s) {
    final u = s.toUpperCase();
    if (u.contains('ACTIVE') || u.contains('APPROVED') || u.contains('ASSIGNED')) return AppColors.success;
    if (u.contains('PENDING') || u.contains('REQUESTED')) return AppColors.warning;
    if (u.contains('REJECTED') || u.contains('CANCELLED')) return AppColors.danger;
    return AppColors.info;
  }
}
