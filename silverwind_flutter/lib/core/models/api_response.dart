/// Generic API response envelope matching backend format.
/// { success: boolean, message: string, data: T }
class ApiResponse<T> {
  final bool success;
  final String message;
  final T data;

  ApiResponse({
    required this.success,
    required this.message,
    required this.data,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] as bool,
      message: json['message'] as String? ?? '',
      data: fromJsonT(json['data']),
    );
  }
}

/// API error response structure.
class ApiErrorResponse {
  final String? message;
  final List<ApiErrorCause>? causes;
  final int? status;
  final String? timestamp;

  ApiErrorResponse({this.message, this.causes, this.status, this.timestamp});

  factory ApiErrorResponse.fromJson(Map<String, dynamic> json) {
    return ApiErrorResponse(
      message: json['message'] as String?,
      causes: (json['causes'] as List<dynamic>?)
          ?.map((e) => ApiErrorCause.fromJson(e as Map<String, dynamic>))
          .toList(),
      status: json['status'] as int?,
      timestamp: json['timestamp'] as String?,
    );
  }
}

class ApiErrorCause {
  final String? field;
  final String? message;

  ApiErrorCause({this.field, this.message});

  factory ApiErrorCause.fromJson(Map<String, dynamic> json) => ApiErrorCause(
    field: json['field'] as String?,
    message: json['message'] as String?,
  );
}
