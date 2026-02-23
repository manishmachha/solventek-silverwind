import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/services/api_service.dart';

import 'shared/widgets/loading_modal.dart';
import 'shared/widgets/app_dialog.dart';

class SilverwindApp extends ConsumerWidget {
  const SilverwindApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final scaffoldKey = ref.watch(scaffoldMessengerKeyProvider);

    return MaterialApp.router(
      title: 'Silverwind',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      scaffoldMessengerKey: scaffoldKey,
      routerConfig: router,
      builder: (context, child) {
        return Stack(
          children: [
            child ?? const SizedBox.shrink(),
            const LoadingModal(),
            const AppDialogOverlay(),
          ],
        );
      },
    );
  }
}
