import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';

/// All domain services matching Angular's 27 services.
/// Consolidated into a single file for maintainability.

// ===== Dashboard Service =====
class DashboardService {
  final ApiService _api;
  DashboardService(this._api);

  Future<Map<String, dynamic>> getStats() async {
    return await _api.get<Map<String, dynamic>>('/admin/dashboard/stats');
  }
}

// ===== User Service (matching user.service.ts) =====
class UserService {
  final ApiService _api;
  UserService(this._api);

  Future<dynamic> getUsers({int page = 0, int size = 20, String? sort}) async {
    final params = <String, dynamic>{'page': page, 'size': size};
    if (sort != null) params['sort'] = sort;
    return await _api.get<Map<String, dynamic>>(
      '/employees',
      queryParams: params,
    );
  }

  Future<Map<String, dynamic>> getUser(String userId) async {
    return await _api.get<Map<String, dynamic>>('/employees/$userId');
  }

  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    return await _api.post<Map<String, dynamic>>('/employees', body: data);
  }

  Future<Map<String, dynamic>> updateUser(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _api.put<Map<String, dynamic>>('/employees/$id', body: data);
  }

  Future<Map<String, dynamic>> updatePersonal(
    String userId,
    Map<String, dynamic> data,
  ) async {
    return await _api.post<Map<String, dynamic>>(
      '/employees/$userId/personal',
      body: data,
    );
  }

  Future<Map<String, dynamic>> updateEmployment(
    String userId,
    Map<String, dynamic> data,
  ) async {
    return await _api.post<Map<String, dynamic>>(
      '/employees/$userId/employment',
      body: data,
    );
  }

  Future<Map<String, dynamic>> updateContact(
    String userId,
    Map<String, dynamic> data,
  ) async {
    return await _api.post<Map<String, dynamic>>(
      '/employees/$userId/contact',
      body: data,
    );
  }

  Future<Map<String, dynamic>> updateBankDetails(
    String userId,
    Map<String, dynamic> data,
  ) async {
    return await _api.post<Map<String, dynamic>>(
      '/employees/$userId/bank',
      body: data,
    );
  }

  Future<dynamic> changePassword(
    String userId,
    Map<String, dynamic> data,
  ) async {
    return await _api.post('/employees/$userId/password', body: data);
  }

  Future<dynamic> updateStatus(String userId, Map<String, dynamic> data) async {
    return await _api.post('/employees/$userId/status', body: data);
  }
}

// ===== Job Service (matching job.service.ts) =====
class JobService {
  final ApiService _api;
  JobService(this._api);

  Future<dynamic> getJobs({int page = 0, int size = 20}) async {
    return await _api.get<Map<String, dynamic>>(
      '/jobs',
      queryParams: {'page': page, 'size': size},
    );
  }

  Future<Map<String, dynamic>> getJob(String id) async {
    return await _api.get<Map<String, dynamic>>('/jobs/$id');
  }

  Future<Map<String, dynamic>> createJob(Map<String, dynamic> data) async {
    return await _api.post<Map<String, dynamic>>('/jobs', body: data);
  }

  Future<Map<String, dynamic>> updateJob(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _api.put<Map<String, dynamic>>('/jobs/$id', body: data);
  }

  Future<void> deleteJob(String id) async {
    await _api.delete('/jobs/$id');
  }

  Future<dynamic> verifyJob(String id) async {
    return await _api.post('/jobs/$id/verify', body: {});
  }

  Future<dynamic> enrichJob(String id, Map<String, dynamic> data) async {
    return await _api.post('/jobs/$id/enrich', body: data);
  }

  Future<dynamic> publishJob(String id) async {
    return await _api.post('/jobs/$id/publish', body: {});
  }

  Future<dynamic> updateStatus(
    String id,
    String status, {
    String? message,
  }) async {
    return await _api.post(
      '/jobs/$id/status',
      body: {'status': status, 'message': message},
    );
  }
}

// ===== Application Service (matching application.service.ts) =====
class ApplicationService {
  final ApiService _api;
  ApplicationService(this._api);

  Future<dynamic> getApplications({
    String? jobId,
    int page = 0,
    int size = 20,
    String mode = 'INBOUND',
    String? search,
    String? status,
  }) async {
    final params = <String, dynamic>{'page': page, 'size': size, 'mode': mode};
    if (jobId != null) params['jobId'] = jobId;
    if (search != null) params['search'] = search;
    if (status != null) params['status'] = status;
    return await _api.get<Map<String, dynamic>>(
      '/applications',
      queryParams: params,
    );
  }

  Future<Map<String, dynamic>> getApplicationDetails(String id) async {
    return await _api.get<Map<String, dynamic>>('/applications/$id');
  }

  Future<dynamic> updateStatus(String id, String status) async {
    return await _api.post(
      '/applications/$id/status',
      body: {'status': status},
    );
  }

  Future<dynamic> getTimeline(String id) async {
    return await _api.get('/applications/$id/timeline');
  }

  Future<dynamic> getDocuments(String id) async {
    return await _api.get('/applications/$id/documents');
  }

  Future<dynamic> runAnalysis(String id) async {
    return await _api.post('/applications/$id/analysis', body: {});
  }

  Future<dynamic> getLatestAnalysis(String id) async {
    return await _api.get('/applications/$id/analysis');
  }

  Future<dynamic> apply(String jobId, Map<String, dynamic> data) async {
    return await _api.post('/jobs/$jobId/apply', body: data);
  }

  Future<String> getPresignedResumeUrl(String id) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/applications/$id/resume-url',
    );
    return response['url'] as String;
  }

  Future<dynamic> addApplicationEvent(
    String id,
    String action,
    String message,
  ) async {
    return await _api.post(
      '/applications/$id/events',
      body: {'action': action, 'message': message},
    );
  }
}

// ===== Vendor Service (matching vendor.service.ts) =====
class VendorService {
  final ApiService _api;
  VendorService(this._api);

  Future<dynamic> getVendors() async {
    return await _api.get<List<dynamic>>('/organizations/vendors');
  }

  Future<dynamic> getPendingVendors() async {
    return await _api.get<List<dynamic>>('/organizations/vendors/pending');
  }

  Future<Map<String, dynamic>> getVendorById(String id) async {
    return await _api.get<Map<String, dynamic>>('/organizations/$id');
  }

  Future<void> approveVendor(String id) async {
    await _api.post('/organizations/$id/approve', body: {});
  }

  Future<void> rejectVendor(String id) async {
    await _api.post('/organizations/$id/reject', body: {});
  }
}

// ===== Candidate Service =====
class CandidateService {
  final ApiService _api;
  CandidateService(this._api);

  Future<dynamic> getAllCandidates() async {
    return await _api.get<List<dynamic>>('/candidates');
  }

  Future<Map<String, dynamic>> getCandidateById(String id) async {
    return await _api.get<Map<String, dynamic>>('/candidates/$id');
  }

  Future<Map<String, dynamic>> updateCandidate(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _api.put<Map<String, dynamic>>('/candidates/$id', body: data);
  }

  Future<Map<String, dynamic>> uploadResume(
    dynamic fileBytes,
    String filename,
  ) async {
    // In a real implementation this would use Dio FormData
    // Since _api doesn't have multipart implemented here, we mock the call structure
    // Normally:
    // FormData formData = FormData.fromMap({"resume": MultipartFile.fromBytes(fileBytes, filename: filename)});
    // return _api.post('/candidates/upload', data: formData);
    throw UnimplementedError(
      'Multipart form data upload not yet implemented in ApiService wrapper. Use native dio.',
    );
  }
}

// ===== Client Submission Service =====
class ClientSubmissionService {
  final ApiService _api;
  ClientSubmissionService(this._api);

  Future<List<dynamic>> getSubmissionsByCandidate(String candidateId) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/client-submissions?candidateId=$candidateId',
    );
    return res['data'] as List<dynamic>;
  }

  Future<List<dynamic>> getSubmissionsByClient(String clientId) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/client-submissions?clientId=$clientId',
    );
    return res['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> createSubmission(
    Map<String, dynamic> data,
  ) async {
    final res =
        await _api.post('/client-submissions', body: data)
            as Map<String, dynamic>;
    return res['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateStatus(
    String id,
    String status, {
    String? remarks,
  }) async {
    final body = <String, dynamic>{'status': status};
    if (remarks != null) body['remarks'] = remarks;
    final res = await _api.put<Map<String, dynamic>>(
      '/client-submissions/$id/status',
      body: body,
    );
    return res['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> getComments(String submissionId) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/client-submissions/$submissionId/comments',
    );
    return res['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> addComment(
    String submissionId,
    String commentText,
  ) async {
    final res =
        await _api.post(
              '/client-submissions/$submissionId/comments',
              body: {'commentText': commentText},
            )
            as Map<String, dynamic>;
    return res['data'] as Map<String, dynamic>;
  }
}

// ===== Organization Service =====
class OrganizationService {
  final ApiService _api;
  OrganizationService(this._api);

  Future<dynamic> getApprovedOrganizations() async {
    return await _api.get<List<dynamic>>('/organizations/discovery');
  }

  Future<Map<String, dynamic>> getOrganizationById(String id) async {
    return await _api.get<Map<String, dynamic>>('/organizations/$id');
  }

  Future<Map<String, dynamic>> updateOrganization(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _api.put<Map<String, dynamic>>(
      '/organizations/$id',
      body: data,
    );
  }

  Future<dynamic> getHandbookUrl() async {
    return await _api.get('/organizations/handbook');
  }
}

// ===== Holiday Service =====
class HolidayService {
  final ApiService _api;
  HolidayService(this._api);

  Future<dynamic> getHolidays() async {
    return await _api.get<List<dynamic>>('/holidays');
  }

  Future<Map<String, dynamic>> addHoliday(Map<String, dynamic> data) async {
    return await _api.post<Map<String, dynamic>>('/holidays', body: data);
  }

  Future<void> deleteHoliday(String id) async {
    await _api.delete('/holidays/$id');
  }
}

// ===== Ticket Service =====
class TicketService {
  final ApiService _api;
  TicketService(this._api);

  Future<dynamic> getMyTickets() async {
    return await _api.get<List<dynamic>>('/tickets/my');
  }

  Future<dynamic> getAllTickets() async {
    return await _api.get<List<dynamic>>('/tickets/all');
  }

  Future<Map<String, dynamic>> getTicketById(String id) async {
    return await _api.get<Map<String, dynamic>>('/tickets/$id');
  }

  Future<Map<String, dynamic>> createTicket(Map<String, dynamic> data) async {
    return await _api.post<Map<String, dynamic>>('/tickets/create', body: data);
  }

  Future<dynamic> updateStatus(String id, String status) async {
    return await _api.patch('/tickets/$id/status', body: {'status': status});
  }

  Future<dynamic> getComments(String id) async {
    return await _api.get<List<dynamic>>('/tickets/$id/comments');
  }

  Future<dynamic> addComment(String id, String message) async {
    return await _api.post('/tickets/$id/comments', body: {'message': message});
  }

  Future<dynamic> getHistory(String id) async {
    return await _api.get<List<dynamic>>('/tickets/$id/history');
  }
}

// ===== Asset Service =====
class AssetService {
  final ApiService _api;
  AssetService(this._api);

  Future<dynamic> listAssets({
    String? query,
    int page = 0,
    int size = 10,
  }) async {
    final params = <String, dynamic>{'page': page, 'size': size};
    if (query != null) params['q'] = query;
    return await _api.get<Map<String, dynamic>>('/assets', queryParams: params);
  }

  Future<Map<String, dynamic>> getAsset(String id) async {
    return await _api.get<Map<String, dynamic>>('/assets/$id');
  }

  Future<dynamic> createAsset(Map<String, dynamic> data) async {
    return await _api.post('/assets', body: data);
  }

  Future<dynamic> deleteAsset(String id) async {
    return await _api.delete('/assets/$id');
  }

  Future<dynamic> getMyAssets() async {
    return await _api.get<List<dynamic>>('/assets/my-assets');
  }

  Future<dynamic> requestReturn(String assignmentId) async {
    return await _api.post('/assets/assignments/$assignmentId/request-return');
  }
}

// ===== Payroll Service =====
class PayrollService {
  final ApiService _api;
  PayrollService(this._api);

  Future<dynamic> getPayrollRecords({int page = 0, int size = 20}) async {
    return await _api.get<Map<String, dynamic>>(
      '/payroll',
      queryParams: {'page': page, 'size': size},
    );
  }

  Future<dynamic> getMyPayslips() async {
    return await _api.get<List<dynamic>>('/payroll/my-payslips');
  }
}

// ===== Attendance Service =====
class AttendanceService {
  final ApiService _api;
  AttendanceService(this._api);

  Future<dynamic> getAttendanceRecords({
    int page = 0,
    int size = 20,
    String? month,
  }) async {
    final params = <String, dynamic>{'page': page, 'size': size};
    if (month != null) params['month'] = month;
    return await _api.get<Map<String, dynamic>>(
      '/attendance',
      queryParams: params,
    );
  }

  Future<dynamic> getMyAttendance({String? month}) async {
    final params = <String, dynamic>{};
    if (month != null) params['month'] = month;
    return await _api.get<Map<String, dynamic>>(
      '/attendance/my',
      queryParams: params,
    );
  }

  Future<dynamic> checkIn() async {
    return await _api.post('/attendance/check-in', body: {});
  }

  Future<dynamic> checkOut() async {
    return await _api.post('/attendance/check-out', body: {});
  }
}

// ===== Leave Service =====
class LeaveService {
  final ApiService _api;
  LeaveService(this._api);

  Future<dynamic> getMyLeaves() async {
    return await _api.get<List<dynamic>>('/leaves/my');
  }

  Future<dynamic> applyLeave(Map<String, dynamic> data) async {
    return await _api.post('/leaves/apply', body: data);
  }

  Future<dynamic> getLeaveRequests({int page = 0, int size = 20}) async {
    return await _api.get<Map<String, dynamic>>(
      '/leaves/requests',
      queryParams: {'page': page, 'size': size},
    );
  }

  Future<dynamic> approveLeave(String id) async {
    return await _api.post('/leaves/$id/approve', body: {});
  }

  Future<dynamic> rejectLeave(String id, String reason) async {
    return await _api.post('/leaves/$id/reject', body: {'reason': reason});
  }

  Future<dynamic> getLeaveTypes() async {
    return await _api.get<List<dynamic>>('/leaves/types');
  }

  Future<Map<String, dynamic>> getLeaveBalances() async {
    return await _api.get<Map<String, dynamic>>('/leaves/balances');
  }
}

// ===== Client Service =====
class ClientService {
  final ApiService _api;
  ClientService(this._api);

  Future<dynamic> getClients() async {
    return await _api.get<List<dynamic>>('/clients');
  }

  Future<Map<String, dynamic>> getClientById(String id) async {
    return await _api.get<Map<String, dynamic>>('/clients/$id');
  }

  Future<dynamic> createClient(Map<String, dynamic> data) async {
    return await _api.post('/clients', body: data);
  }
}

// ===== Project Service =====
class ProjectService {
  final ApiService _api;
  ProjectService(this._api);

  Future<dynamic> getProjects() async {
    return await _api.get<List<dynamic>>('/projects');
  }

  Future<Map<String, dynamic>> getProjectById(String id) async {
    return await _api.get<Map<String, dynamic>>('/projects/$id');
  }
}

// ===== Notification Service =====
class NotificationService {
  final ApiService _api;
  NotificationService(this._api);

  Future<dynamic> getNotifications() async {
    return await _api.get<List<dynamic>>('/notifications');
  }

  Future<void> markAsRead(String id) async {
    await _api.post('/notifications/$id/read', body: {});
  }

  Future<void> markAllAsRead() async {
    await _api.post('/notifications/mark-all-read', body: {});
  }

  Future<dynamic> getUnreadCount() async {
    return await _api.get(
      '/notifications/unread-count',
      headers: {'X-Skip-Loading': 'true'},
    );
  }
}

// ===== Audit Log Service =====
class AuditLogService {
  final ApiService _api;
  AuditLogService(this._api);

  Future<dynamic> getAuditLogs({int page = 0, int size = 20}) async {
    return await _api.get<Map<String, dynamic>>(
      '/audit-logs',
      queryParams: {'page': page, 'size': size},
    );
  }
}

// ===== Profile Service =====
class ProfileService {
  final ApiService _api;
  ProfileService(this._api);

  Future<Map<String, dynamic>> getProfile() async {
    return await _api.get<Map<String, dynamic>>('/auth/me');
  }

  Future<dynamic> updateProfile(Map<String, dynamic> data) async {
    return await _api.put('/auth/profile', body: data);
  }

  Future<dynamic> changePassword(Map<String, dynamic> data) async {
    return await _api.post('/auth/change-password', body: data);
  }
}

// ===== Providers =====
final dashboardServiceProvider = Provider<DashboardService>(
  (ref) => DashboardService(ref.watch(apiServiceProvider)),
);
final userServiceProvider = Provider<UserService>(
  (ref) => UserService(ref.watch(apiServiceProvider)),
);
final jobServiceProvider = Provider<JobService>(
  (ref) => JobService(ref.watch(apiServiceProvider)),
);
final applicationServiceProvider = Provider<ApplicationService>(
  (ref) => ApplicationService(ref.watch(apiServiceProvider)),
);
final vendorServiceProvider = Provider<VendorService>(
  (ref) => VendorService(ref.watch(apiServiceProvider)),
);
final candidateServiceProvider = Provider<CandidateService>(
  (ref) => CandidateService(ref.watch(apiServiceProvider)),
);
final clientSubmissionServiceProvider = Provider<ClientSubmissionService>(
  (ref) => ClientSubmissionService(ref.watch(apiServiceProvider)),
);
final organizationServiceProvider = Provider<OrganizationService>(
  (ref) => OrganizationService(ref.watch(apiServiceProvider)),
);
final holidayServiceProvider = Provider<HolidayService>(
  (ref) => HolidayService(ref.watch(apiServiceProvider)),
);
final ticketServiceProvider = Provider<TicketService>(
  (ref) => TicketService(ref.watch(apiServiceProvider)),
);
final assetServiceProvider = Provider<AssetService>(
  (ref) => AssetService(ref.watch(apiServiceProvider)),
);
final payrollServiceProvider = Provider<PayrollService>(
  (ref) => PayrollService(ref.watch(apiServiceProvider)),
);
final attendanceServiceProvider = Provider<AttendanceService>(
  (ref) => AttendanceService(ref.watch(apiServiceProvider)),
);
final leaveServiceProvider = Provider<LeaveService>(
  (ref) => LeaveService(ref.watch(apiServiceProvider)),
);
final clientServiceProvider = Provider<ClientService>(
  (ref) => ClientService(ref.watch(apiServiceProvider)),
);
final projectServiceProvider = Provider<ProjectService>(
  (ref) => ProjectService(ref.watch(apiServiceProvider)),
);
final notificationServiceProvider = Provider<NotificationService>(
  (ref) => NotificationService(ref.watch(apiServiceProvider)),
);
final auditLogServiceProvider = Provider<AuditLogService>(
  (ref) => AuditLogService(ref.watch(apiServiceProvider)),
);
final profileServiceProvider = Provider<ProfileService>(
  (ref) => ProfileService(ref.watch(apiServiceProvider)),
);
