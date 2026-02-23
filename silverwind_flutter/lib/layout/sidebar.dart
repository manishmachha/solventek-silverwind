import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/providers/auth_provider.dart';
import '../core/models/auth_models.dart';
import '../config/app_colors.dart';
import '../config/app_constants.dart';

/// Sidebar matching Angular SidebarComponent exactly.
/// Role-based menu sections with collapsible groups and notification badges.
class AppSidebar extends ConsumerStatefulWidget {
  final VoidCallback? onMenuTap;

  const AppSidebar({super.key, this.onMenuTap});

  @override
  ConsumerState<AppSidebar> createState() => _AppSidebarState();
}

class _AppSidebarState extends ConsumerState<AppSidebar> {
  @override
  void initState() {
    super.initState();
  }

  // ===== Menu Configuration (matching Angular sidebar exactly) =====
  static final List<_MenuSection> _menuSectionsConfig = [
    _MenuSection(
      title: 'Dashboard',
      icon: Icons.grid_view_rounded,
      items: [
        _MenuItem(
          label: 'Overview',
          route: '/dashboard',
          icon: Icons.speed,
          roles: UserRole.values,
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        ),
        _MenuItem(
          label: 'My Organization',
          route: '/organization/my-organization',
          icon: Icons.business,
          roles: UserRole.values,
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        ),
        _MenuItem(
          label: 'Explore',
          route: '/organization/discovery',
          icon: Icons.language,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
          ],
          orgTypes: ['SOLVENTEK'],
        ),
      ],
    ),
    _MenuSection(
      title: 'Administration',
      icon: Icons.shield,
      items: [
        _MenuItem(
          label: 'Vendors',
          route: '/vendors',
          icon: Icons.storefront,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Employees',
          route: '/admin/employees',
          icon: Icons.people,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Audit Logs',
          route: '/admin/audit-logs',
          icon: Icons.analytics,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
      ],
    ),
    _MenuSection(
      title: 'Recruitment',
      icon: Icons.work,
      items: [
        _MenuItem(
          label: 'Jobs',
          route: '/jobs',
          icon: Icons.work,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
            UserRole.VENDOR,
          ],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        ),
        _MenuItem(
          label: 'Candidates',
          route: '/candidates',
          icon: Icons.badge,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
            UserRole.VENDOR,
          ],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        ),
        _MenuItem(
          label: 'Applications',
          route: '/applications',
          icon: Icons.description,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
          ],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Track Applications',
          route: '/track-applications',
          icon: Icons.checklist,
          roles: [UserRole.VENDOR],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        ),
      ],
    ),
    _MenuSection(
      title: 'Workforce',
      icon: Icons.people,
      items: [
        _MenuItem(
          label: 'Clients',
          route: '/clients',
          icon: Icons.business_center,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
          ],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Projects',
          route: '/projects',
          icon: Icons.view_kanban,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
          ],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Holidays',
          route: '/holidays',
          icon: Icons.event,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
            UserRole.EMPLOYEE,
          ],
          orgTypes: ['SOLVENTEK'],
        ),
      ],
    ),
    _MenuSection(
      title: 'Assets',
      icon: Icons.laptop,
      items: [
        _MenuItem(
          label: 'Asset Management',
          route: '/admin/assets',
          icon: Icons.laptop,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'My Assets',
          route: '/my-assets',
          icon: Icons.inventory_2,
          roles: [UserRole.EMPLOYEE],
          orgTypes: ['SOLVENTEK'],
        ),
      ],
    ),
    _MenuSection(
      title: 'Leaves & Pay',
      icon: Icons.payments,
      items: [
        _MenuItem(
          label: 'Attendance Mgmt',
          route: '/admin/attendance',
          icon: Icons.calendar_today,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Leave Requests',
          route: '/admin/leave-management',
          icon: Icons.date_range,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Leave Config',
          route: '/admin/leave-configuration',
          icon: Icons.settings,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'My Attendance',
          route: '/my-attendance',
          icon: Icons.calendar_month,
          roles: [UserRole.EMPLOYEE],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'My Leaves',
          route: '/my-leaves',
          icon: Icons.event_busy,
          roles: [UserRole.EMPLOYEE],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'Payroll Mgmt',
          route: '/admin/payroll',
          icon: Icons.currency_rupee,
          roles: [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.ADMIN],
          orgTypes: ['SOLVENTEK'],
        ),
        _MenuItem(
          label: 'My Payslips',
          route: '/my-payslips',
          icon: Icons.receipt_long,
          roles: [UserRole.EMPLOYEE],
          orgTypes: ['SOLVENTEK'],
        ),
      ],
    ),
    _MenuSection(
      title: 'Support',
      icon: Icons.headset_mic,
      items: [
        _MenuItem(
          label: 'My Tickets',
          route: '/portal/tickets',
          icon: Icons.confirmation_number,
          roles: [
            UserRole.SUPER_ADMIN,
            UserRole.HR_ADMIN,
            UserRole.ADMIN,
            UserRole.TA,
            UserRole.EMPLOYEE,
          ],
          orgTypes: ['SOLVENTEK'],
        ),
      ],
    ),
  ];

  List<_MenuSection> _calculateVisibleSections(
    String? roleName,
    String? orgType,
  ) {
    final userRole = UserRole.values
        .where((r) => r.name == roleName)
        .firstOrNull;
    if (userRole == null || orgType == null) return [];

    return _menuSectionsConfig
        .map((section) {
          final validItems = section.items.where((item) {
            return item.roles.contains(userRole) &&
                item.orgTypes.contains(orgType);
          }).toList();
          return _MenuSection(
            title: section.title,
            icon: section.icon,
            items: validItems,
            collapsed: false,
          );
        })
        .where((section) => section.items.isNotEmpty)
        .toList();
  }

  String _getOrgName(String? orgType) {
    if (orgType == 'SOLVENTEK') return 'Silverwind';
    if (orgType == 'VENDOR') return 'Vendor Portal';
    return 'Silverwind';
  }

  String _getPortalType(String? orgType) {
    if (orgType == 'SOLVENTEK') return 'Solventek VMS';
    if (orgType == 'VENDOR') return 'Vendor Portal';
    return 'VMS';
  }

  String _formatRole(String? role) {
    if (role == null) return '';
    return role
        .replaceAll('_', ' ')
        .split(' ')
        .map(
          (w) => w.isNotEmpty
              ? '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}'
              : '',
        )
        .join(' ');
  }

  Color _getRoleBadgeColor(String? role) {
    switch (role) {
      case 'SUPER_ADMIN':
        return AppColors.danger;
      case 'HR_ADMIN':
        return AppColors.warning;
      case 'ADMIN':
        return AppColors.primary;
      case 'TA':
        return AppColors.info;
      case 'VENDOR':
        return AppColors.success;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(authProvider);
    final authNotifier = ref.read(authProvider.notifier);
    final roleName = authNotifier.userRole;
    final orgType = authNotifier.orgType;
    final sections = _calculateVisibleSections(roleName, orgType);

    final currentPath = GoRouterState.of(context).matchedLocation;

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // Logo Header
          Container(
            height: AppConstants.headerHeight,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: AppColors.surface200.withValues(alpha: 0.5),
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: orgType == 'VENDOR'
                        ? AppColors.gradientVendor
                        : AppColors.gradientPrimary,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: AppConstants.shadowMd,
                  ),
                  child: Center(
                    child: Text(
                      _getOrgName(orgType)[0],
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) =>
                            (orgType == 'VENDOR'
                                    ? AppColors.gradientVendor
                                    : AppColors.gradientPrimary)
                                .createShader(bounds),
                        child: Text(
                          _getOrgName(orgType),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      Text(
                        _getPortalType(orgType),
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textLight,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Navigation
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              children: [
                ...sections.map(
                  (section) => _SidebarSection(
                    section: section,
                    currentPath: currentPath,
                    onItemTap: (route) {
                      context.go(route);
                      widget.onMenuTap?.call();
                    },
                  ),
                ),

                const Divider(height: 32),

                // Profile Link
                _NavItem(
                  label: 'My Profile',
                  icon: Icons.account_circle,
                  isActive: currentPath == '/profile',
                  onTap: () {
                    context.go('/profile');
                    widget.onMenuTap?.call();
                  },
                ),
              ],
            ),
          ),

          // Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: AppColors.surface200.withValues(alpha: 0.5),
                ),
              ),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: orgType == 'VENDOR'
                    ? AppColors.gradientVendorLight
                    : LinearGradient(
                        colors: [AppColors.primary50, const Color(0xFFF5F3FF)],
                      ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: _getRoleBadgeColor(
                        roleName,
                      ).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _formatRole(roleName),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: _getRoleBadgeColor(roleName),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '© 2026 Solventek Technologies',
                    style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ===== Private Helper Widgets =====

class _SidebarSection extends StatefulWidget {
  final _MenuSection section;
  final String currentPath;
  final void Function(String route) onItemTap;

  const _SidebarSection({
    required this.section,
    required this.currentPath,
    required this.onItemTap,
  });

  @override
  State<_SidebarSection> createState() => _SidebarSectionState();
}

class _SidebarSectionState extends State<_SidebarSection> {
  bool _collapsed = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        InkWell(
          onTap: () => setState(() => _collapsed = !_collapsed),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Icon(widget.section.icon, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.section.title.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMuted,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                Icon(
                  _collapsed ? Icons.chevron_right : Icons.expand_more,
                  size: 16,
                  color: AppColors.textLight,
                ),
              ],
            ),
          ),
        ),

        // Section Items
        AnimatedCrossFade(
          duration: AppConstants.durationNormal,
          crossFadeState: _collapsed
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          firstChild: Column(
            children: widget.section.items.map((item) {
              final isActive = widget.currentPath == item.route;
              return _NavItem(
                label: item.label,
                icon: item.icon,
                isActive: isActive,
                onTap: () => widget.onItemTap(item.route),
              );
            }).toList(),
          ),
          secondChild: const SizedBox.shrink(),
        ),

        const SizedBox(height: 8),
      ],
    );
  }
}

class _NavItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: AnimatedContainer(
            duration: AppConstants.durationFast,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: isActive
                  ? const LinearGradient(
                      colors: [AppColors.primary50, Color(0xFFF5F3FF)],
                    )
                  : null,
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: isActive ? Colors.white : AppColors.gray100,
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    icon,
                    size: 16,
                    color: isActive ? AppColors.primary : AppColors.textMuted,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isActive
                          ? AppColors.primaryDark
                          : AppColors.textMuted,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isActive)
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primary,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ===== Models =====
class _MenuSection {
  final String title;
  final IconData icon;
  final List<_MenuItem> items;
  final bool collapsed;

  _MenuSection({
    required this.title,
    required this.icon,
    required this.items,
    this.collapsed = false,
  });
}

class _MenuItem {
  final String label;
  final String route;
  final IconData icon;
  final List<UserRole> roles;
  final List<String> orgTypes;

  _MenuItem({
    required this.label,
    required this.route,
    required this.icon,
    required this.roles,
    required this.orgTypes,
  });
}
