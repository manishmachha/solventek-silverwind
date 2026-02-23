import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_models.dart';
import '../providers/auth_provider.dart';
import 'api_service.dart';

/// Auth service matching Angular's AuthService.
class AuthService {
  final ApiService _api;
  final AuthNotifier _authNotifier;

  AuthService(this._api, this._authNotifier);

  /// Login with email and password
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      body: {'email': email, 'password': password},
    );
    final authResponse = AuthResponse.fromJson(response);
    _authNotifier.login(authResponse);
    return authResponse;
  }

  /// Refresh current user data
  Future<User> refreshUser() async {
    final userData = await _api.get<Map<String, dynamic>>('/auth/me');
    final user = User.fromJson(userData);
    _authNotifier.updateUser(user);
    return user;
  }

  /// Register vendor
  Future<dynamic> registerVendor(Map<String, dynamic> data) async {
    return await _api.post('/auth/register-vendor', body: data);
  }

  /// Logout
  void logout() {
    _authNotifier.logout();
  }
}

// ===== Provider =====
final authServiceProvider = Provider<AuthService>((ref) {
  final api = ref.watch(apiServiceProvider);
  final authNotifier = ref.watch(authProvider.notifier);
  return AuthService(api, authNotifier);
});
