import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import 'superadmin_dashboard.dart';
import 'hradmin_dashboard.dart';
import 'ta_dashboard.dart';
import 'employee_dashboard.dart';
import 'vendor_dashboard.dart';

/// Dynamically loads the correct dashboard based on user role.
/// Matches Angular's RoleDashboardComponent.
class RoleDashboardPage extends ConsumerWidget {
  const RoleDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null) {
      return const Center(child: Text('Not authenticated'));
    }

    final role = user.role.name;
    final orgType = user.orgType;

    switch (role) {
      case 'SUPER_ADMIN':
        return const SuperadminDashboard();
      case 'HR_ADMIN':
        return const HradminDashboard();
      case 'TA':
      case 'TALENT_ACQUISITION':
        return const TaDashboard();
      case 'EMPLOYEE':
        if (orgType == 'VENDOR' || orgType == 'SOLVENTEK') {
          return const VendorDashboard();
        }
        return const EmployeeDashboard();
      default:
        if (orgType == 'VENDOR') {
          return const VendorDashboard();
        }
        return const EmployeeDashboard();
    }
  }
}
