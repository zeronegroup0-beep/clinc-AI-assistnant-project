/// Model for chat messages, transparent reasoning steps, and confirmation cards
class ChatMessageModel {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final List<String> reasoningSteps;
  final Map<String, dynamic>? card;
  final List<String> suggestedSlots;
  final bool isStreaming;

  ChatMessageModel({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.reasoningSteps = const [],
    this.card,
    this.suggestedSlots = const [],
    this.isStreaming = false,
  });

  factory ChatMessageModel.user(String text) {
    return ChatMessageModel(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      text: text,
      isUser: true,
      timestamp: DateTime.now(),
    );
  }

  factory ChatMessageModel.bot({
    required String text,
    List<String> reasoningSteps = const [],
    Map<String, dynamic>? card,
    List<String> suggestedSlots = const [],
  }) {
    return ChatMessageModel(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      text: text,
      isUser: false,
      timestamp: DateTime.now(),
      reasoningSteps: reasoningSteps,
      card: card,
      suggestedSlots: suggestedSlots,
    );
  }
}
