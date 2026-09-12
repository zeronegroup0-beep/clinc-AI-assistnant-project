import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class ChatAgentResponse {
  final bool success;
  final String sessionId;
  final String reply;
  final List<String> reasoningSteps;
  final Map<String, dynamic> state;
  final Map<String, dynamic>? card;
  final List<String> suggestedSlots;

  ChatAgentResponse({
    required this.success,
    required this.sessionId,
    required this.reply,
    required this.reasoningSteps,
    required this.state,
    this.card,
    this.suggestedSlots = const [],
  });

  factory ChatAgentResponse.fromJson(Map<String, dynamic> json) {
    return ChatAgentResponse(
      success: json['success'] == true,
      sessionId: json['sessionId'] as String? ?? 'default_session',
      reply: json['reply'] as String? ?? '',
      reasoningSteps: (json['reasoningSteps'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      state: (json['state'] as Map<String, dynamic>?) ?? {},
      card: json['card'] as Map<String, dynamic>?,
      suggestedSlots: (json['suggestedSlots'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

/// Service communicating with the Virtual Receptionist AI Agent endpoint
class ChatAgentService {
  final ApiClient _apiClient;
  String _sessionId;

  ChatAgentService({required ApiClient apiClient})
      : _apiClient = apiClient,
        _sessionId = 'flutter_${DateTime.now().millisecondsSinceEpoch}';

  String get sessionId => _sessionId;

  /// Send message to the Egyptian AI Receptionist (/api/chat)
  Future<ChatAgentResponse> sendMessage({
    required String message,
    Map<String, dynamic>? sessionData,
  }) async {
    final payload = {
      'message': message,
      'sessionId': _sessionId,
      'sessionData': sessionData ?? {},
    };

    final response = await _apiClient.post(
      ApiConstants.chat,
      data: payload,
    );

    final rawData = response.data;
    if (rawData is Map<String, dynamic>) {
      final parsed = ChatAgentResponse.fromJson(rawData);
      _sessionId = parsed.sessionId;
      return parsed;
    }

    throw Exception('استجابة غير متوقعة من الوكيل الذكي');
  }

  /// Reset session and clear conversation context (/api/chat/reset)
  Future<void> resetSession() async {
    try {
      await _apiClient.post(
        ApiConstants.resetChat,
        data: {'sessionId': _sessionId},
      );
    } catch (_) {}
    _sessionId = 'flutter_${DateTime.now().millisecondsSinceEpoch}';
  }
}
