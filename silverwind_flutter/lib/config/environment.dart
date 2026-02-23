/// Environment configuration for the Silverwind app.
enum Environment { dev, prod }

class AppConfig {
  static Environment _environment = Environment.dev;

  static void init(Environment env) {
    _environment = env;
  }

  static Environment get environment => _environment;

  static String get apiBaseUrl {
    switch (_environment) {
      case Environment.dev:
        return 'https://www.solventek.com/api'; // Local backend
      case Environment.prod:
        return 'https://www.solventek.com/api';
    }
  }

  static bool get isProduction => _environment == Environment.prod;
}
