import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import 'api_exceptions.dart';

/// Core HTTP Client wrapping Dio with tenant headers and error interception
class ApiClient {
  late final Dio _dio;
  String _baseUrl;
  String? _tenantId;
  String? _authToken;

  ApiClient({String? baseUrl, String? tenantId})
      : _baseUrl = baseUrl ?? ApiConstants.defaultBaseUrl,
        _tenantId = tenantId {
    _initDio();
  }

  void _initDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (_tenantId != null) 'x-tenant-id': _tenantId,
          if (_authToken != null) 'Authorization': 'Bearer $_authToken',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_tenantId != null) {
            options.headers['x-tenant-id'] = _tenantId;
          }
          if (_authToken != null) {
            options.headers['Authorization'] = 'Bearer $_authToken';
          }
          if (kDebugMode) {
            debugPrint('[DIO-REQUEST] ${options.method} ${options.uri}');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint('[DIO-RESPONSE] ${response.statusCode} from ${response.requestOptions.uri}');
          }
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          if (kDebugMode) {
            debugPrint('[DIO-ERROR] ${e.type} on ${e.requestOptions.uri}: ${e.message}');
          }
          return handler.next(e);
        },
      ),
    );
  }

  /// Update active tenant ID header (for multi-tenant SaaS switching)
  void setTenantId(String tenantId) {
    _tenantId = tenantId;
    _dio.options.headers['x-tenant-id'] = tenantId;
  }

  /// Update base URL dynamically (e.g. settings screen or environment switch)
  void setBaseUrl(String url) {
    _baseUrl = url;
    _dio.options.baseUrl = url;
  }

  /// Update JWT authentication token
  void setAuthToken(String? token) {
    _authToken = token;
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    } else {
      _dio.options.headers.remove('Authorization');
    }
  }

  /// Send GET request
  asyncGet(String path, {Map<String, dynamic>? queryParameters}) async {
    return get(path, queryParameters: queryParameters);
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException('Unexpected network error: $e');
    }
  }

  /// Send POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException('Unexpected network error: $e');
    }
  }

  /// Handle and transform Dio errors into user-friendly typed exceptions
  ApiException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException('انتهت مهلة الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
      case DioExceptionType.connectionError:
        return NetworkException('تعذر الاتصال بالخادم على ${_dio.options.baseUrl}. تأكد من تشغيل السيرفر المحلي');
      case DioExceptionType.badResponse:
        final status = error.response?.statusCode;
        final responseData = error.response?.data;
        String message = 'حدث خطأ في الخادم';
        if (responseData is Map && responseData['message'] != null) {
          message = responseData['message'].toString();
        }
        if (status == 400) {
          return ValidationException(message, data: responseData);
        }
        return ServerException(message, statusCode: status, data: responseData);
      case DioExceptionType.cancel:
        return ApiException('تم إلغاء الطلب');
      default:
        return ApiException('خطأ غير متوقع: ${error.message}');
    }
  }
}
