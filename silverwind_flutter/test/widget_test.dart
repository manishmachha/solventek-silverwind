// Basic smoke test for SilverwindApp

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:silverwind_flutter/app.dart';

void main() {
  testWidgets('App smoke test - SilverwindApp builds without errors', (
    WidgetTester tester,
  ) async {
    // Build the app wrapped in ProviderScope (required by Riverpod)
    await tester.pumpWidget(const ProviderScope(child: SilverwindApp()));

    // Verify the app renders without throwing
    expect(find.byType(SilverwindApp), findsOneWidget);
  });
}
