import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_models.dart';

// ===== Auth State =====
class AuthState {
  final User? user;
  final String? accessToken;
  final String? refreshToken;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.accessToken,
    this.refreshToken,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    String? accessToken,
    String? refreshToken,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  static const AuthState initial = AuthState();
}

// ===== Auth Notifier (matches Angular AuthStore) =====
class AuthNotifier extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage;
  String? _viewRole;

  AuthNotifier(this._storage) : super(AuthState.initial) {
    _loadFromStorage();
  }

  // ===== Computed-like getters =====
  String? get actualRole => state.user?.role.name;
  String? get userRole => _viewRole ?? actualRole;
  String? get viewRole => _viewRole;
  String? get organizationId => state.user?.orgId;
  String? get orgType => state.user?.orgType;
  String? get organizationName => state.user?.organization?.name;

  // Role helper methods (matching Angular AuthStore)
  bool isSuperAdmin() => userRole == 'SUPER_ADMIN';
  bool isHRAdmin() => userRole == 'HR_ADMIN';
  bool isTA() => userRole == 'TA';
  bool isEmployee() => userRole == 'EMPLOYEE';
  bool isVendor() => userRole == 'VENDOR';
  bool isAdmin() => ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'].contains(userRole);

  bool hasPermission(String code) {
    if (actualRole == 'SUPER_ADMIN') return true;
    return false;
  }

  // ===== Actions =====
  void login(AuthResponse response) {
    state = AuthState(
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    );
    _saveToStorage(response);
  }

  void updateUser(User user) {
    state = state.copyWith(user: user);
    _storage.write(key: 'user', value: jsonEncode(user.toJson()));
  }

  void setViewRole(String? role) {
    if (role == actualRole) {
      _viewRole = null;
    } else {
      _viewRole = role;
    }
    // Force rebuild by updating state
    state = state.copyWith();
  }

  void logout() {
    _viewRole = null;
    state = AuthState.initial;
    _clearStorage();
  }

  void setLoading(bool isLoading) {
    state = state.copyWith(isLoading: isLoading);
  }

  void setError(String error) {
    state = state.copyWith(error: error, isLoading: false);
  }

  // ===== Storage =====
  Future<void> _saveToStorage(AuthResponse response) async {
    await _storage.write(key: 'access_token', value: response.accessToken);
    await _storage.write(key: 'refresh_token', value: response.refreshToken);
    await _storage.write(
      key: 'user',
      value: jsonEncode(response.user.toJson()),
    );
  }

  Future<void> _loadFromStorage() async {
    final accessToken = await _storage.read(key: 'access_token');
    final refreshToken = await _storage.read(key: 'refresh_token');
    final userStr = await _storage.read(key: 'user');

    if (accessToken != null && userStr != null) {
      try {
        final user = User.fromJson(jsonDecode(userStr) as Map<String, dynamic>);
        state = AuthState(
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: true,
          isLoading: false,
        );
      } catch (e) {
        debugPrint('Failed to parse user from storage: $e');
        logout();
      }
    }
  }

  Future<void> _clearStorage() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
    await _storage.delete(key: 'user');
  }
}

// ===== Providers =====
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(storage);
});

// ===== Loading Provider (matches Angular LoadingService) =====
class LoadingNotifier extends StateNotifier<int> {
  LoadingNotifier() : super(0);

  bool get isLoading => state > 0;
  void show() => state = state + 1;
  void hide() => state = state > 0 ? state - 1 : 0;
}

final loadingProvider = StateNotifierProvider<LoadingNotifier, int>((ref) {
  return LoadingNotifier();
});

final isLoadingProvider = Provider<bool>((ref) {
  return ref.watch(loadingProvider) > 0;
});

// ===== Dialog State (matches Angular DialogService) =====
enum DialogType { success, warning, error }

class DialogState {
  final bool isOpen;
  final String title;
  final String message;
  final DialogType type;
  final VoidCallback? onClose;

  const DialogState({
    this.isOpen = false,
    this.title = '',
    this.message = '',
    this.type = DialogType.success,
    this.onClose,
  });
}

class DialogNotifier extends StateNotifier<DialogState> {
  DialogNotifier() : super(const DialogState());

  void open(
    String title,
    String message,
    DialogType type, [
    VoidCallback? onClose,
  ]) {
    state = DialogState(
      isOpen: true,
      title: title,
      message: message,
      type: type,
      onClose: onClose,
    );
  }

  void close() {
    final callback = state.onClose;
    state = const DialogState();
    callback?.call();
  }
}

final dialogProvider = StateNotifierProvider<DialogNotifier, DialogState>((
  ref,
) {
  return DialogNotifier();
});
