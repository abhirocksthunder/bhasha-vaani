import 'package:flutter/material.dart';

import 'app/bhasha_vaani_app.dart';
import 'core/config/app_config.dart';

void main() {
  runApp(
    BhashaVaaniApp(
      config: AppConfig.fromEnvironment(),
    ),
  );
}
