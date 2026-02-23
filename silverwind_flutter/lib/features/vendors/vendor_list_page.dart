import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../config/app_colors.dart';
import '../../config/app_constants.dart';
import '../../core/services/domain_services.dart';
import '../../shared/widgets/organization_logo_widget.dart';

// Dummy provider for notifications
final _unreadVendorsProvider = FutureProvider<Set<String>>((ref) async {
  try {
    return <String>{}; // Placeholder
  } catch (_) {
    return <String>{};
  }
});

class VendorListPage extends ConsumerStatefulWidget {
  const VendorListPage({super.key});
  @override
  ConsumerState<VendorListPage> createState() => _VendorListPageState();
}

class _VendorListPageState extends ConsumerState<VendorListPage> {
  List<dynamic> _items = [];
  bool _loading = true;
  String _searchQuery = '';
  String _activeTab = 'all';
  final _searchController = TextEditingController();

  final List<Map<String, String>> _tabs = [
    {'label': 'All Vendors', 'value': 'all'},
    {'label': 'Pending', 'value': 'PENDING_VERIFICATION'},
    {'label': 'Approved', 'value': 'APPROVED'},
    {'label': 'Active', 'value': 'ACTIVE'},
    {'label': 'Rejected', 'value': 'REJECTED'},
  ];

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
      final svc = ref.read(vendorServiceProvider);
      final result = await svc.getVendors();
      if (mounted) {
        setState(() {
          if (result is List) {
            _items = result;
          } else if (result is Map<String, dynamic> &&
              result.containsKey('content')) {
            _items = (result['content'] as List<dynamic>?) ?? [];
          } else {
            _items = [];
          }
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _items = [];
          _loading = false;
        });
      }
    }
  }

  List<dynamic> get _filteredItems {
    final unreads = ref.watch(_unreadVendorsProvider).valueOrNull ?? {};

    // Sort logic (notified first)
    var sorted = List<dynamic>.from(_items);
    sorted.sort((a, b) {
      final aId = a['id']?.toString() ?? '';
      final bId = b['id']?.toString() ?? '';
      final aHas = unreads.contains(aId) ? 1 : 0;
      final bHas = unreads.contains(bId) ? 1 : 0;
      return bHas.compareTo(aHas);
    });

    // Tab filter
    if (_activeTab != 'all') {
      sorted = sorted.where((v) => v['status'] == _activeTab).toList();
    }

    // Search filter
    if (_searchQuery.trim().isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      sorted = sorted.where((v) {
        final name = (v['name'] ?? '').toString().toLowerCase();
        return name.contains(query);
      }).toList();
    }

    return sorted;
  }

  int get _pendingCount =>
      _items.where((v) => v['status'] == 'PENDING_VERIFICATION').length;
  int get _approvedCount => _items
      .where((v) => v['status'] == 'APPROVED' || v['status'] == 'ACTIVE')
      .length;

  Future<void> _approveVendor(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Approve Vendor'),
        content: const Text('Are you sure you want to approve this vendor?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Approve'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      try {
        final svc = ref.read(vendorServiceProvider);
        await svc.approveVendor(id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Vendor approved')));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error approving vendor: $e')));
        }
      }
    }
  }

  Future<void> _rejectVendor(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Vendor'),
        content: const Text('Are you sure you want to reject this vendor?'),
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
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      try {
        final svc = ref.read(vendorServiceProvider);
        await svc.rejectVendor(id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Vendor rejected')));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error rejecting vendor: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredItems;
    final unreadsAsync = ref.watch(_unreadVendorsProvider);
    final unreads = unreadsAsync.valueOrNull ?? {};

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with Stats
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Vendor Management',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMain,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Manage vendor organizations',
                    style: TextStyle(fontSize: 14, color: AppColors.textMuted),
                  ),
                ],
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '$_pendingCount Pending',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: AppColors.warning,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '$_approvedCount Approved',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Filter Tabs & Search
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.surface200),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 600;

                final tabsWidget = SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _tabs.map((tab) {
                      final isActive = _activeTab == tab['value'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: InkWell(
                          onTap: () =>
                              setState(() => _activeTab = tab['value']!),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? AppColors.primary.withValues(alpha: 0.1)
                                  : Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              tab['label']!,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: isActive
                                    ? AppColors.primary
                                    : Colors.grey.shade600,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                );

                final searchWidget = Container(
                  width: isWide ? 250 : double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    decoration: const InputDecoration(
                      hintText: 'Search vendors...',
                      prefixIcon: Icon(
                        Icons.search,
                        size: 20,
                        color: Colors.grey,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                );

                if (isWide) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: tabsWidget),
                      const SizedBox(width: 16),
                      searchWidget,
                    ],
                  );
                } else {
                  return Column(
                    children: [
                      tabsWidget,
                      const SizedBox(height: 16),
                      searchWidget,
                    ],
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 24),

          // Content
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.storefront,
                            size: 40,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'No vendors found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textMain,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _searchQuery.isNotEmpty
                              ? 'Try a different search term'
                              : 'No vendors in this category',
                          style: const TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      int count = 1;
                      if (constraints.maxWidth >= 1200) {
                        count = 3;
                      } else if (constraints.maxWidth >= 800) {
                        count = 2;
                      }

                      return GridView.builder(
                        padding: const EdgeInsets.only(bottom: 24),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: count,
                          crossAxisSpacing: 24,
                          mainAxisSpacing: 24,
                          mainAxisExtent: 220,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          final id = item['id']?.toString() ?? '';
                          return _buildVendorCard(
                            item,
                            hasNotification: unreads.contains(id),
                            onApprove: () => _approveVendor(id),
                            onReject: () => _rejectVendor(id),
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildVendorCard(
    Map<String, dynamic> vendor, {
    required bool hasNotification,
    required VoidCallback onApprove,
    required VoidCallback onReject,
  }) {
    final name = vendor['name'] ?? '';
    final status = (vendor['status'] ?? '').toString();
    final type = vendor['type'] ?? 'VENDOR';
    final createdAt = vendor['createdAt'] != null
        ? DateFormat.yMMMd().format(DateTime.parse(vendor['createdAt']))
        : '--';
    final id = vendor['id']?.toString() ?? '';

    Color getStatusColor(String s) {
      if (s == 'PENDING_VERIFICATION') {
        return AppColors.warning;
      }
      if (s == 'APPROVED' || s == 'ACTIVE') {
        return AppColors.success;
      }
      if (s == 'REJECTED') {
        return AppColors.danger;
      }
      return AppColors.primary;
    }

    final sColor = getStatusColor(status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasNotification ? Colors.red.shade300 : AppColors.surface200,
          width: hasNotification ? 2 : 1,
        ),
        boxShadow: hasNotification
            ? [
                BoxShadow(
                  color: Colors.red.withValues(alpha: 0.1),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ]
            : AppConstants.shadowCard,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.go('/vendors/$id'),
          hoverColor: AppColors.primary.withValues(alpha: 0.05),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    OrganizationLogoWidget(
                      org: vendor,
                      orgId: id,
                      size: 48,
                      rounded: true,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  name,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textMain,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (hasNotification)
                                Container(
                                  width: 10,
                                  height: 10,
                                  margin: const EdgeInsets.only(left: 8),
                                  decoration: const BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: sColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              status.replaceAll('_', ' ').toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: sColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Info details
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.business,
                            size: 16,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          type.toString(),
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.calendar_today,
                            size: 16,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Registered $createdAt',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Spacer(),

              // Actions
              Container(
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.grey.shade100)),
                ),
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    if (status == 'PENDING_VERIFICATION') ...[
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onApprove,
                          icon: const Icon(Icons.check, size: 16),
                          label: const Text('Approve'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.success.withValues(
                              alpha: 0.1,
                            ),
                            foregroundColor: AppColors.success,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onReject,
                          icon: const Icon(Icons.close, size: 16),
                          label: const Text('Reject'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.danger.withValues(
                              alpha: 0.1,
                            ),
                            foregroundColor: AppColors.danger,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ] else ...[
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => context.go('/vendors/$id'),
                          icon: const Icon(Icons.visibility, size: 16),
                          label: const Text('View Details'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary.withValues(
                              alpha: 0.1,
                            ),
                            foregroundColor: AppColors.primary,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
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
    );
  }
}
