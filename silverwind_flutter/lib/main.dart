import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/environment.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Default to dev environment
  AppConfig.init(Environment.dev);

  runApp(const ProviderScope(child: SilverwindApp()));
}
