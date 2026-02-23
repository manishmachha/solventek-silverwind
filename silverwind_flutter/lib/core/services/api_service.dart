import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/environment.dart';
import '../interceptors/interceptors.dart';

/// API Service matching Angular's ApiService.
/// Wraps Dio with response envelope extraction.
class ApiService {
  late final Dio _dio;
  final Ref _ref;

  ApiService(
    this._ref, {
    required GlobalKey<ScaffoldMessengerState> scaffoldKey,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors in order (matching Angular app.config.ts)
    _dio.interceptors.addAll([
      AuthInterceptor(_ref),
      LoadingInterceptor(_ref),
      UnauthorizedInterceptor(_ref),
      ErrorInterceptor(
        _ref,
        showErrorSnackbar: (msg) {
          scaffoldKey.currentState?.showSnackBar(
            SnackBar(
              content: Text(msg),
              backgroundColor: const Color(0xFFDC2626),
              duration: const Duration(seconds: 5),
              action: SnackBarAction(
                label: 'Close',
                textColor: Colors.white,
                onPressed: () {},
              ),
            ),
          );
        },
      ),
      SuccessInterceptor(
        showSuccessSnackbar: (msg) {
          scaffoldKey.currentState?.showSnackBar(
            SnackBar(
              content: Text(msg),
              backgroundColor: const Color(0xFF16A34A),
              duration: const Duration(seconds: 3),
              action: SnackBarAction(
                label: 'Close',
                textColor: Colors.white,
                onPressed: () {},
              ),
            ),
          );
        },
      ),
    ]);
  }

  /// GET request - extracts data from response envelope
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParams,
    T Function(dynamic)? fromJson,
    Map<String, dynamic>? headers,
  }) async {
    final response = await _dio.get(
      path,
      queryParameters: queryParams,
      options: headers != null ? Options(headers: headers) : null,
    );
    return _extractData<T>(response.data, fromJson);
  }

  /// POST request - extracts data from response envelope
  Future<T> post<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? fromJson,
    Map<String, dynamic>? headers,
  }) async {
    final response = await _dio.post(
      path,
      data: body,
      options: headers != null ? Options(headers: headers) : null,
    );
    return _extractData<T>(response.data, fromJson);
  }

  /// PUT request - extracts data from response envelope
  Future<T> put<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? fromJson,
    Map<String, dynamic>? headers,
  }) async {
    final response = await _dio.put(
      path,
      data: body,
      options: headers != null ? Options(headers: headers) : null,
    );
    return _extractData<T>(response.data, fromJson);
  }

  /// PATCH request - extracts data from response envelope
  Future<T> patch<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? fromJson,
    Map<String, dynamic>? headers,
  }) async {
    final response = await _dio.patch(
      path,
      data: body,
      options: headers != null ? Options(headers: headers) : null,
    );
    return _extractData<T>(response.data, fromJson);
  }

  /// DELETE request - extracts data from response envelope
  Future<T> delete<T>(
    String path, {
    T Function(dynamic)? fromJson,
    Map<String, dynamic>? headers,
  }) async {
    final response = await _dio.delete(
      path,
      options: headers != null ? Options(headers: headers) : null,
    );
    return _extractData<T>(response.data, fromJson);
  }

  /// Download file as bytes
  Future<List<int>> download(String path) async {
    final response = await _dio.get(
      path,
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data as List<int>;
  }

  /// Extract data from API response envelope { success, message, data }
  T _extractData<T>(dynamic responseData, T Function(dynamic)? fromJson) {
    if (responseData is Map<String, dynamic> &&
        responseData.containsKey('data')) {
      final data = responseData['data'];
      if (fromJson != null) {
        return fromJson(data);
      }
      return data as T;
    }
    if (fromJson != null) {
      return fromJson(responseData);
    }
    return responseData as T;
  }
}

// ===== Scaffold Key Provider =====
final scaffoldMessengerKeyProvider =
    Provider<GlobalKey<ScaffoldMessengerState>>((ref) {
      return GlobalKey<ScaffoldMessengerState>();
    });

// ===== API Service Provider =====
final apiServiceProvider = Provider<ApiService>((ref) {
  final scaffoldKey = ref.watch(scaffoldMessengerKeyProvider);
  return ApiService(ref, scaffoldKey: scaffoldKey);
});
