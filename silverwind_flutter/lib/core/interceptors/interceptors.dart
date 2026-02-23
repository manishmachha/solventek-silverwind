import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../../config/environment.dart';

/// Auth interceptor matching Angular's auth.interceptor.ts.
/// Attaches Bearer token to all API requests.
class AuthInterceptor extends Interceptor {
  final Ref _ref;

  AuthInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final authState = _ref.read(authProvider);
    final token = authState.accessToken;
    final isApiUrl =
        options.path.startsWith(AppConfig.apiBaseUrl) ||
        options.path.startsWith('/');

    if (token != null && isApiUrl) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    handler.next(options);
  }
}

/// Loading interceptor matching Angular's loading.interceptor.ts.
/// Shows/hides global loading overlay. Respects X-Skip-Loading header.
class LoadingInterceptor extends Interceptor {
  final Ref _ref;

  LoadingInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.headers.containsKey('X-Skip-Loading')) {
      options.headers.remove('X-Skip-Loading');
      handler.next(options);
      return;
    }

    _ref.read(loadingProvider.notifier).show();
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _ref.read(loadingProvider.notifier).hide();
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _ref.read(loadingProvider.notifier).hide();
    handler.next(err);
  }
}

/// Error interceptor matching Angular's error.interceptor.ts.
/// Parses structured API errors and shows snackbar notifications.
class ErrorInterceptor extends Interceptor {
  final Ref _ref;
  final void Function(String message) showErrorSnackbar;

  ErrorInterceptor(this._ref, {required this.showErrorSnackbar});

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    String message = 'An unexpected error occurred. Please try again.';

    final response = err.response;
    if (response != null) {
      final data = response.data;

      if (data is Map<String, dynamic>) {
        // Check for structured ApiErrorResponse
        if (data['message'] != null) {
          final causes = data['causes'] as List<dynamic>?;
          if (causes != null && causes.isNotEmpty) {
            final firstCause = causes[0] as Map<String, dynamic>?;
            message =
                firstCause?['message'] as String? ?? data['message'] as String;
          } else {
            message = data['message'] as String;
          }
        }
      } else {
        switch (response.statusCode) {
          case 0:
            message =
                'Unable to connect to the server. Please check your internet connection.';
            break;
          case 400:
            message = 'Bad Request. Please check your input.';
            break;
          case 401:
            message = 'Session expired. Please login again.';
            break;
          case 403:
            message = 'Access Denied. You do not have permission.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 409:
            message = 'Conflict. This resource already exists.';
            break;
          case 422:
            message = 'Validation Error. Please check your data.';
            break;
          case 500:
            message = 'Internal Server Error. Our team has been notified.';
            break;
          case 503:
            message = 'Service Unavailable. Please try again later.';
            break;
          default:
            message = 'Error ${response.statusCode}: ${response.statusMessage}';
        }
      }
    } else if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timeout. Please try again.';
    } else if (err.type == DioExceptionType.connectionError) {
      message =
          'Unable to connect to the server. Please check your internet connection.';
    }

    showErrorSnackbar(message);
    handler.next(err);
  }
}

/// Success interceptor matching Angular's success.interceptor.ts.
/// Shows success snackbar for state-modifying requests (POST/PUT/PATCH/DELETE).
class SuccessInterceptor extends Interceptor {
  final void Function(String message) showSuccessSnackbar;

  SuccessInterceptor({required this.showSuccessSnackbar});

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final method = response.requestOptions.method.toUpperCase();
    final isModification = ['POST', 'PUT', 'PATCH', 'DELETE'].contains(method);

    if (isModification && response.data is Map<String, dynamic>) {
      final body = response.data as Map<String, dynamic>;
      final success = body['success'] as bool? ?? false;
      final message = body['message'] as String?;

      if (success && message != null && message.isNotEmpty) {
        showSuccessSnackbar(message);
      }
    }

    handler.next(response);
  }
}

/// Unauthorized interceptor matching Angular's unauthorized.interceptor.ts.
/// Handles 403 responses with dialog.
class UnauthorizedInterceptor extends Interceptor {
  final Ref _ref;

  UnauthorizedInterceptor(this._ref);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 403) {
      _ref
          .read(dialogProvider.notifier)
          .open(
            'Access Denied',
            'You are not authorized to perform this action based on your current role and permissions.',
            DialogType.error,
          );
    }

    handler.next(err);
  }
}
