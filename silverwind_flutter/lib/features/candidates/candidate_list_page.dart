import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_colors.dart';
import '../../config/app_constants.dart';
import '../../core/services/domain_services.dart';
import '../../core/providers/auth_provider.dart';

// Assuming NotificationService has a method similar to getUnreadEntityIds. If not, we'll dummy it.
final _unreadCandidatesProvider = FutureProvider<Set<String>>((ref) async {
  // Try fetching notifications if the API supports it. Otherwise return empty set.
  try {
    return <String>{}; // Placeholder
  } catch (_) {
    return <String>{};
  }
});

class CandidateListPage extends ConsumerStatefulWidget {
  const CandidateListPage({super.key});
  @override
  ConsumerState<CandidateListPage> createState() => _CandidateListPageState();
}

class _CandidateListPageState extends ConsumerState<CandidateListPage> {
  List<dynamic> _items = [];
  bool _loading = true;
  String _searchQuery = '';
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
      final svc = ref.read(candidateServiceProvider);
      final result = await svc.getAllCandidates();

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
          // Sort notified candidates first (mocked logic as unreads are usually handled via provider)
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
    final unreads = ref.watch(_unreadCandidatesProvider).valueOrNull ?? {};

    // Sort
    var sorted = List<dynamic>.from(_items);
    sorted.sort((a, b) {
      final aId = a['id']?.toString() ?? '';
      final bId = b['id']?.toString() ?? '';
      final aHas = unreads.contains(aId) ? 1 : 0;
      final bHas = unreads.contains(bId) ? 1 : 0;
      return bHas.compareTo(aHas);
    });

    if (_searchQuery.isEmpty) {
      return sorted;
    }

    final q = _searchQuery.toLowerCase();
    return sorted.where((item) {
      final firstName = (item['firstName'] ?? '').toString().toLowerCase();
      final lastName = (item['lastName'] ?? '').toString().toLowerCase();
      final email = (item['email'] ?? '').toString().toLowerCase();
      final List<dynamic> skills = item['skills'] ?? [];

      return firstName.contains(q) ||
          lastName.contains(q) ||
          email.contains(q) ||
          skills.any((s) => s.toString().toLowerCase().contains(q));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredItems;
    final isEmployee = ref.watch(authProvider.notifier).isEmployee();
    final unreadsAsync = ref.watch(_unreadCandidatesProvider);
    final unreads = unreadsAsync.valueOrNull ?? {};

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Candidates',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMain,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Manage your candidate database',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (!isEmployee)
                ElevatedButton.icon(
                  onPressed: () => context.go('/candidates/new'),
                  icon: const Icon(Icons.add, size: 20),
                  label: const Text('Add Candidate'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),

          // Search
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade300),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Icon(Icons.search, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    decoration: const InputDecoration(
                      hintText:
                          'Search candidates by name, email, or skills...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
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
                        const Icon(
                          Icons.people_outline,
                          size: 48,
                          color: Colors.grey,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No candidates found',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Get started by creating a new candidate or uploading a resume.',
                          style: TextStyle(color: Colors.grey),
                        ),
                        if (!isEmployee) ...[
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () => context.go('/candidates/new'),
                            icon: const Icon(Icons.add, size: 20),
                            label: const Text('Add Candidate'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ],
                    ),
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      // Determine grid columns based on width
                      int crossAxisCount = 1;
                      if (constraints.maxWidth >= 1024) {
                        crossAxisCount = 3;
                      } else if (constraints.maxWidth >= 640) {
                        crossAxisCount = 2;
                      }

                      return GridView.builder(
                        padding: const EdgeInsets.only(bottom: 24),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          crossAxisSpacing: 24,
                          mainAxisSpacing: 24,
                          mainAxisExtent: 220, // fixed height for uniformity
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          return _CandidateCard(
                            candidate: item,
                            hasNotification: unreads.contains(
                              item['id']?.toString() ?? '',
                            ),
                            isEmployee: isEmployee,
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
}

class _CandidateCard extends StatelessWidget {
  final Map<String, dynamic> candidate;
  final bool hasNotification;
  final bool isEmployee;

  const _CandidateCard({
    required this.candidate,
    required this.hasNotification,
    required this.isEmployee,
  });

  @override
  Widget build(BuildContext context) {
    final id = candidate['id']?.toString() ?? '';
    final firstName = candidate['firstName'] ?? '';
    final lastName = candidate['lastName'] ?? '';
    final email = candidate['email'] ?? '';
    final designation = candidate['currentDesignation'] ?? 'Candidate';
    final initials =
        '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}';
    final List<dynamic> skills = candidate['skills'] ?? [];
    final experience = candidate['experienceYears'] ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.go('/candidates/$id'),
          hoverColor: AppColors.primary.withValues(alpha: 0.05),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header section
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primary50,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initials.toUpperCase(),
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '$firstName $lastName',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                    color: AppColors.textMain,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (hasNotification)
                                Container(
                                  width: 12,
                                  height: 12,
                                  margin: const EdgeInsets.only(left: 8),
                                  decoration: const BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            designation,
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 13,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.email_outlined,
                                size: 14,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  email,
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 13,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Skills chips
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    ...skills
                        .take(4)
                        .map(
                          (skill) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              skill.toString(),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Colors.blue.shade800,
                              ),
                            ),
                          ),
                        ),
                    if (skills.length > 4)
                      Padding(
                        padding: const EdgeInsets.only(top: 2, left: 4),
                        child: Text(
                          '+${skills.length - 4} more',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const Spacer(),

              // Footer Actions
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  border: Border(top: BorderSide(color: Colors.grey.shade100)),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Exp: $experience yrs',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    Row(
                      children: [
                        InkWell(
                          onTap: () => context.go('/candidates/$id'),
                          child: const Text(
                            'View',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                        if (!isEmployee) ...[
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 8.0),
                            child: Text(
                              '|',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                          InkWell(
                            onTap: () => context.go('/candidates/edit/$id'),
                            child: const Text(
                              'Edit',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.primary,
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
      ),
    );
  }
}
