import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/providers/auth_provider.dart';
import '../config/app_colors.dart';
import '../config/app_constants.dart';
import '../shared/widgets/user_avatar.dart';

/// Header matching Angular HeaderComponent.
class AppHeader extends ConsumerWidget {
  final VoidCallback onToggleSidebar;

  const AppHeader({super.key, required this.onToggleSidebar});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final authNotifier = ref.read(authProvider.notifier);
    final user = authState.user;

    return Container(
      height: AppConstants.headerHeight,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.8),
        border: Border(
          bottom: BorderSide(
            color: AppColors.surface200.withValues(alpha: 0.5),
          ),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Hamburger (mobile only)
          MediaQuery.of(context).size.width < AppConstants.breakpointMd
              ? IconButton(
                  onPressed: onToggleSidebar,
                  icon: const Icon(Icons.menu, color: AppColors.textMuted),
                )
              : const SizedBox.shrink(),

          const Spacer(),

          // View As Role (Super Admin only)
          if (authNotifier.actualRole == 'SUPER_ADMIN') ...[
            PopupMenuButton<String>(
              tooltip: 'View as role',
              offset: const Offset(0, 48),
              itemBuilder: (context) => [
                for (final role in [
                  'SUPER_ADMIN',
                  'HR_ADMIN',
                  'TA',
                  'EMPLOYEE',
                  'VENDOR',
                ])
                  PopupMenuItem(
                    value: role,
                    child: Row(
                      children: [
                        Icon(
                          authNotifier.userRole == role
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          size: 16,
                          color: authNotifier.userRole == role
                              ? AppColors.primary
                              : AppColors.textMuted,
                        ),
                        const SizedBox(width: 8),
                        Text(role.replaceAll('_', ' ')),
                      ],
                    ),
                  ),
              ],
              onSelected: (role) {
                authNotifier.setViewRole(role);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary100),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.visibility, size: 14, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text(
                      'View: ${authNotifier.userRole?.replaceAll('_', ' ') ?? ''}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],

          // Notification Bell
          IconButton(
            onPressed: () => context.go('/notifications'),
            icon: const Icon(
              Icons.notifications_outlined,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(width: 8),

          // User Menu
          PopupMenuButton<String>(
            offset: const Offset(0, 48),
            itemBuilder: (context) => [
              PopupMenuItem(
                enabled: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.fullName ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMain,
                      ),
                    ),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(value: 'profile', child: Text('My Profile')),
              const PopupMenuItem(value: 'logout', child: Text('Logout')),
            ],
            onSelected: (value) {
              if (value == 'profile') context.go('/profile');
              if (value == 'logout') {
                authNotifier.logout();
                context.go('/login');
              }
            },
            child: UserAvatar(
              firstName: user?.firstName ?? '',
              lastName: user?.lastName ?? '',
              profilePhotoUrl: user?.profilePhotoUrl,
              size: 36,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
