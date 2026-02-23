import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import '../../config/app_colors.dart';

/// Dialog overlay matching Angular's DialogComponent.
/// Displays success/warning/error dialogs globally.
class AppDialogOverlay extends ConsumerWidget {
  const AppDialogOverlay({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dialogState = ref.watch(dialogProvider);

    if (!dialogState.isOpen) return const SizedBox.shrink();

    return Material(
      color: Colors.black.withValues(alpha: 0.5),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxWidth: 400),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A000000),
                blurRadius: 25,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _getIconBg(dialogState.type),
                ),
                child: Icon(
                  _getIcon(dialogState.type),
                  color: _getIconColor(dialogState.type),
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),

              // Title
              Text(
                dialogState.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMain,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // Message
              Text(
                dialogState.message,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textMuted,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Close button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => ref.read(dialogProvider.notifier).close(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _getIconColor(dialogState.type),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'OK',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIcon(DialogType type) {
    switch (type) {
      case DialogType.success:
        return Icons.check_circle_outline;
      case DialogType.warning:
        return Icons.warning_amber_outlined;
      case DialogType.error:
        return Icons.error_outline;
    }
  }

  Color _getIconColor(DialogType type) {
    switch (type) {
      case DialogType.success:
        return AppColors.success;
      case DialogType.warning:
        return AppColors.warning;
      case DialogType.error:
        return AppColors.danger;
    }
  }

  Color _getIconBg(DialogType type) {
    switch (type) {
      case DialogType.success:
        return AppColors.successBg;
      case DialogType.warning:
        return AppColors.warningBg;
      case DialogType.error:
        return AppColors.dangerBg;
    }
  }
}
