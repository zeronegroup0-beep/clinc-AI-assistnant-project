/// Unified generic API Response container matching Node.js response format
class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;
  final int? count;
  final Map<String, dynamic>? raw;

  ApiResponse({
    required this.success,
    this.message,
    this.data,
    this.count,
    this.raw,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic data)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] == true,
      message: json['message'] as String?,
      count: json['count'] as int?,
      data: (json['data'] != null && fromJsonT != null)
          ? fromJsonT(json['data'])
          : null,
      raw: json,
    );
  }
}
