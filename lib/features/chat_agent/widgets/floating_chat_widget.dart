import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/tenant_provider.dart';
import '../models/chat_message_model.dart';
import '../services/chat_agent_service.dart';
import 'chat_bubble.dart';

/// Persistent Floating AI Agent Chat Widget that overlays the SaaS application
class FloatingChatAgentWidget extends StatefulWidget {
  final ChatAgentService chatService;

  const FloatingChatAgentWidget({
    Key? key,
    required this.chatService,
  }) : super(key: key);

  @override
  State<FloatingChatAgentWidget> createState() => _FloatingChatAgentWidgetState();
}

class _FloatingChatAgentWidgetState extends State<FloatingChatAgentWidget>
    with SingleTickerProviderStateMixin {
  bool _isOpen = false;
  final List<ChatMessageModel> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;
  int _unreadCount = 1;

  // Suggestion chips matching Egyptian conversational edge cases
  final List<String> _quickSuggestions = [
    'فاضيين بكرة؟',
    'عايز دكتور الأسنان',
    'احجزلي الإثنين',
    'الكشف بكام؟',
    '01012345678',
  ];

  @override
  void initState() {
    super.initState();
    // Initial friendly greeting from Noura
    _messages.add(
      ChatMessageModel.bot(
        text: 'أهلاً بحضرتك يا فندم في عيادتنا! أنا "نورا" موظفة الاستقبال الذكية، إزاي أقدر أساعدك النهاردة؟',
      ),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage([String? textToSend]) async {
    final text = (textToSend ?? _inputController.text).trim();
    if (text.isEmpty || _isSending) return;

    _inputController.clear();
    setState(() {
      _messages.add(ChatMessageModel.user(text));
      _isSending = true;
    });
    _scrollToBottom();

    try {
      final response = await widget.chatService.sendMessage(message: text);

      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessageModel.bot(
              text: response.reply,
              reasoningSteps: response.reasoningSteps,
              card: response.card,
              suggestedSlots: response.suggestedSlots,
            ),
          );
          _isSending = false;
        });
        _scrollToBottom();
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessageModel.bot(
              text: 'بعتذر لحضرتك جداً، حصل عطل بسيط في الاتصال بالخادم. يرجى المحاولة مرة تانية.',
            ),
          );
          _isSending = false;
        });
        _scrollToBottom();
      }
    }
  }

  Future<void> _resetChat() async {
    await widget.chatService.resetSession();
    setState(() {
      _messages.clear();
      _messages.add(
        ChatMessageModel.bot(
          text: 'تم بدء جلسة محادثة جديدة. أهلاً بحضرتك، إزاي أقدر أساعدك؟',
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final tenantProv = context.watch<TenantProvider>();
    final activeTenant = tenantProv.activeTenant;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Stack(
        children: [
          // Expanded Chat Window
          if (_isOpen)
            Positioned(
              left: 20,
              bottom: 90,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: 380,
                  maxHeight: MediaQuery.of(context).size.height * 0.72,
                ),
                child: Material(
                  elevation: 12,
                  borderRadius: BorderRadius.circular(20),
                  color: activeTenant.surfaceColor,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: activeTenant.primaryColor.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: activeTenant.primaryColor.withValues(alpha: 0.12),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(20),
                            ),
                          ),
                          child: Row(
                            children: [
                              Stack(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: activeTenant.primaryColor,
                                    child: const Icon(
                                      Icons.support_agent_rounded,
                                      size: 22,
                                      color: Colors.black,
                                    ),
                                  ),
                                  Positioned(
                                    right: 0,
                                    bottom: 0,
                                    child: Container(
                                      width: 10,
                                      height: 10,
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.greenAccent,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${AppConstants.agentName} - ${AppConstants.agentRole}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      'متصلة الآن للرد على استفساراتكم',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: activeTenant.primaryColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.refresh_rounded, size: 18),
                                tooltip: 'إعادة تعيين المحادثة',
                                onPressed: _resetChat,
                              ),
                              IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                tooltip: 'إغلاق',
                                onPressed: () => setState(() => _isOpen = false),
                              ),
                            ],
                          ),
                        ),

                        // Message List
                        Expanded(
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.all(12),
                            itemCount: _messages.length,
                            itemBuilder: (context, index) {
                              return ChatBubble(
                                message: _messages[index],
                                primaryColor: activeTenant.primaryColor,
                              );
                            },
                          ),
                        ),

                        // Thinking Indicator
                        if (_isSending)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 4),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: activeTenant.primaryColor,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'نورا تفكر وتتحقق من البيانات...',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: activeTenant.primaryColor,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Quick suggestion chips
                        Container(
                          height: 38,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _quickSuggestions.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 6),
                            itemBuilder: (context, i) {
                              final suggestion = _quickSuggestions[i];
                              return ActionChip(
                                label: Text(
                                  suggestion,
                                  style: const TextStyle(fontSize: 11),
                                ),
                                backgroundColor: Colors.white.withValues(alpha: 0.06),
                                onPressed: () => _sendMessage(suggestion),
                              );
                            },
                          ),
                        ),

                        // Input Field & Send Button
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _inputController,
                                  textInputAction: TextInputAction.send,
                                  onSubmitted: (_) => _sendMessage(),
                                  decoration: InputDecoration(
                                    hintText: 'اكتب رسالتك لنورا...',
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 10,
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        Icons.send_rounded,
                                        color: activeTenant.primaryColor,
                                      ),
                                      onPressed: () => _sendMessage(),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          // Floating Action Button (FAB)
          Positioned(
            left: 20,
            bottom: 20,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                FloatingActionButton.extended(
                  onPressed: () {
                    setState(() {
                      _isOpen = !_isOpen;
                      if (_isOpen) _unreadCount = 0;
                    });
                  },
                  backgroundColor: activeTenant.primaryColor,
                  foregroundColor: Colors.black,
                  icon: const Icon(Icons.support_agent_rounded, size: 24),
                  label: Text(
                    _isOpen ? 'إخفاء نورا' : 'تحدث مع نورا AI',
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (!_isOpen && _unreadCount > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(5),
                      decoration: const BoxDecoration(
                        color: Colors.redAccent,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$_unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
