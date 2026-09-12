/// Standardized API and Network Exceptions
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

class NetworkException extends ApiException {
  NetworkException(String message) : super(message, statusCode: 0);
}

class ServerException extends ApiException {
  ServerException(String message, {int? statusCode, dynamic data})
      : super(message, statusCode: statusCode ?? 500, data: data);
}

class ValidationException extends ApiException {
  ValidationException(String message, {dynamic data})
      : super(message, statusCode: 400, data: data);
}
