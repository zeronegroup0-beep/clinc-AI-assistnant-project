import 'package:flutter/material.dart';
import '../models/chat_message_model.dart';
import 'confirmation_card_view.dart';
import 'reasoning_step_view.dart';

/// Message bubble widget supporting Egyptian dialect text, reasoning steps, and cards
class ChatBubble extends StatelessWidget {
  final ChatMessageModel message;
  final Color primaryColor;

  const ChatBubble({
    Key? key,
    required this.message,
    required this.primaryColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: primaryColor.withValues(alpha: 0.25),
              child: Icon(Icons.support_agent_rounded,
                  size: 16, color: primaryColor),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isUser
                    ? primaryColor.withValues(alpha: 0.18)
                    : Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isUser ? const Radius.circular(2) : const Radius.circular(16),
                  bottomRight: !isUser ? const Radius.circular(2) : const Radius.circular(16),
                ),
                border: Border.all(
                  color: isUser
                      ? primaryColor.withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.1),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Show reasoning steps if present on bot messages
                  if (!isUser && message.reasoningSteps.isNotEmpty)
                    ReasoningStepView(
                      steps: message.reasoningSteps,
                      primaryColor: primaryColor,
                    ),

                  // Message text
                  Text(
                    message.text,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: Colors.white,
                      fontFamily: 'Cairo',
                    ),
                  ),

                  // Show confirmation card if returned
                  if (message.card != null)
                    ConfirmationCardView(
                      card: message.card!,
                      primaryColor: primaryColor,
                    ),

                  // Timestamp
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.bottomLeft,
                    child: Text(
                      '${message.timestamp.hour.toString().padLeft(2, '0')}:${message.timestamp.minute.toString().padLeft(2, '0')}',
                      style: TextStyle(
                        fontSize: 9,
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 14,
              backgroundColor: Colors.white.withValues(alpha: 0.1),
              child: const Icon(Icons.person_rounded,
                  size: 16, color: Colors.white70),
            ),
          ],
        ],
      ),
    );
  }
}
