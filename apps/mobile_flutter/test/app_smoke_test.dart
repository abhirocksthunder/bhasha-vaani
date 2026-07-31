import 'package:bhasha_vaani/app/bhasha_vaani_app.dart';
import 'package:bhasha_vaani/core/config/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows the BhashaVaani profile selector', (tester) async {
    await tester.pumpWidget(
      const BhashaVaaniApp(
        config: AppConfig(
          apiBaseUrl: 'http://localhost:8000',
          environmentName: 'test',
        ),
      ),
    );

    expect(find.text('BhashaVaani'), findsOneWidget);
    expect(find.text('Who is learning today?'), findsOneWidget);
    expect(find.text('Abhilash'), findsOneWidget);
  });

  testWidgets('shows retryable offline state when backend is unavailable', (
    tester,
  ) async {
    await tester.pumpWidget(
      const BhashaVaaniApp(
        config: AppConfig(
          apiBaseUrl: 'http://127.0.0.1:9',
          environmentName: 'test',
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(seconds: 2));

    expect(find.text('Backend is not reachable'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(find.text('Abhilash'), findsOneWidget);
  });
}
