import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../layout/main_layout.dart';
import '../../features/auth/login_page.dart';
import '../../features/dashboard/role_dashboard_page.dart';
import '../../features/admin/user_list_page.dart';
import '../../features/admin/user_details_page.dart';
import '../../features/admin/user_create_page.dart';
import '../../features/admin/audit_log_list_page.dart';
import '../../features/vendors/vendor_list_page.dart';
import '../../features/vendors/vendor_detail_page.dart';
import '../../features/jobs/job_list_page.dart';
import '../../features/jobs/job_create_page.dart';
import '../../features/jobs/job_detail_page.dart';
import '../../features/applications/application_list_page.dart';
import '../../features/applications/application_detail_page.dart';
import '../../features/applications/vendor_application_list_page.dart';
import '../../features/applications/track_application_list_page.dart';
import '../../features/candidates/candidate_list_page.dart';
import '../../features/candidates/candidate_form_page.dart';
import '../../features/candidates/candidate_detail_page.dart';
import '../../features/projects/project_list_page.dart';
import '../../features/projects/project_detail_page.dart';
import '../../features/clients/client_list_page.dart';
import '../../features/clients/client_detail_page.dart';
import '../../features/tickets/ticket_list_page.dart';
import '../../features/tickets/ticket_detail_page.dart';
import '../../features/holidays/holiday_list_page.dart';
import '../../features/assets/asset_list_page.dart';
import '../../features/assets/my_assets_page.dart';
import '../../features/payroll/payroll_management_page.dart';
import '../../features/payroll/my_payslips_page.dart';
import '../../features/attendance/attendance_management_page.dart';
import '../../features/attendance/my_attendance_page.dart';
import '../../features/leave/my_leaves_page.dart';
import '../../features/leave/leave_management_page.dart';
import '../../features/leave/leave_configuration_page.dart';
import '../../features/organization/approved_orgs_page.dart';
import '../../features/organization/my_organization_page.dart';
import '../../features/notifications/notifications_page.dart';
import '../../features/profile/profile_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginPage = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoginPage) {
        return '/login';
      }
      if (isAuthenticated && isLoginPage) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      // ===== Login =====
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),

      // ===== Authenticated Shell =====
      ShellRoute(
        builder: (context, state, child) => MainLayout(child: child),
        routes: [
          // Profile
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),

          // Notifications
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsPage(),
          ),

          // Dashboard
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const RoleDashboardPage(),
          ),

          // Vendors
          GoRoute(
            path: '/vendors',
            builder: (context, state) => const VendorListPage(),
          ),
          GoRoute(
            path: '/vendors/:id',
            builder: (context, state) =>
                VendorDetailPage(id: state.pathParameters['id']!),
          ),

          // Jobs
          GoRoute(
            path: '/jobs',
            builder: (context, state) => const JobListPage(),
          ),
          GoRoute(
            path: '/jobs/create',
            builder: (context, state) => const JobCreatePage(),
          ),
          GoRoute(
            path: '/jobs/edit/:id',
            builder: (context, state) =>
                JobCreatePage(jobId: state.pathParameters['id']),
          ),
          GoRoute(
            path: '/jobs/:id',
            builder: (context, state) =>
                JobDetailPage(id: state.pathParameters['id']!),
          ),

          // Applications
          GoRoute(
            path: '/applications',
            builder: (context, state) => const ApplicationListPage(),
          ),
          GoRoute(
            path: '/applications/:id',
            builder: (context, state) =>
                ApplicationDetailPage(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/track-applications',
            builder: (context, state) => const TrackApplicationListPage(),
          ),
          GoRoute(
            path: '/vendor-applications',
            builder: (context, state) => const VendorApplicationListPage(),
          ),

          // Admin
          GoRoute(
            path: '/admin/employees',
            builder: (context, state) => const UserListPage(),
          ),
          GoRoute(
            path: '/admin/employees/create',
            builder: (context, state) => const UserCreatePage(),
          ),
          GoRoute(
            path: '/admin/employees/:id',
            builder: (context, state) =>
                UserDetailsPage(userId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/admin/employees/:id/edit',
            builder: (context, state) =>
                UserCreatePage(userId: state.pathParameters['id']),
          ),
          GoRoute(
            path: '/admin/audit-logs',
            builder: (context, state) => const AuditLogListPage(),
          ),

          // Organization
          GoRoute(
            path: '/organization/discovery',
            builder: (context, state) => const ApprovedOrgsPage(),
          ),
          GoRoute(
            path: '/organization/my-organization',
            builder: (context, state) => const MyOrganizationPage(),
          ),
          GoRoute(
            path: '/organization/:id',
            builder: (context, state) =>
                VendorDetailPage(id: state.pathParameters['id']!),
          ),

          // Candidates
          GoRoute(
            path: '/candidates',
            builder: (context, state) => const CandidateListPage(),
          ),
          GoRoute(
            path: '/candidates/new',
            builder: (context, state) => const CandidateFormPage(),
          ),
          GoRoute(
            path: '/candidates/edit/:id',
            builder: (context, state) =>
                CandidateFormPage(editId: state.pathParameters['id']),
          ),
          GoRoute(
            path: '/candidates/:id',
            builder: (context, state) =>
                CandidateDetailPage(id: state.pathParameters['id']!),
          ),

          // Projects
          GoRoute(
            path: '/projects',
            builder: (context, state) => const ProjectListPage(),
          ),
          GoRoute(
            path: '/projects/:id',
            builder: (context, state) =>
                ProjectDetailPage(id: state.pathParameters['id']!),
          ),

          // Clients
          GoRoute(
            path: '/clients',
            builder: (context, state) => const ClientListPage(),
          ),
          GoRoute(
            path: '/clients/:id',
            builder: (context, state) =>
                ClientDetailPage(id: state.pathParameters['id']!),
          ),

          // Tickets
          GoRoute(
            path: '/portal/tickets',
            builder: (context, state) => const TicketListPage(),
          ),
          GoRoute(
            path: '/portal/tickets/:id',
            builder: (context, state) =>
                TicketDetailPage(id: state.pathParameters['id']!),
          ),

          // Holidays
          GoRoute(
            path: '/holidays',
            builder: (context, state) => const HolidayListPage(),
          ),

          // Assets
          GoRoute(
            path: '/admin/assets',
            builder: (context, state) => const AssetListPage(),
          ),
          GoRoute(
            path: '/my-assets',
            builder: (context, state) => const MyAssetsPage(),
          ),

          // Payroll
          GoRoute(
            path: '/admin/payroll',
            builder: (context, state) => const PayrollManagementPage(),
          ),
          GoRoute(
            path: '/my-payslips',
            builder: (context, state) => const MyPayslipsPage(),
          ),

          // Attendance
          GoRoute(
            path: '/admin/attendance',
            builder: (context, state) => const AttendanceManagementPage(),
          ),
          GoRoute(
            path: '/my-attendance',
            builder: (context, state) => const MyAttendancePage(),
          ),

          // Leave
          GoRoute(
            path: '/my-leaves',
            builder: (context, state) => const MyLeavesPage(),
          ),
          GoRoute(
            path: '/admin/leave-management',
            builder: (context, state) => const LeaveManagementPage(),
          ),
          GoRoute(
            path: '/admin/leave-configuration',
            builder: (context, state) => const LeaveConfigurationPage(),
          ),
        ],
      ),
    ],
  );
});
