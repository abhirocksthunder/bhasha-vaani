import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiClient {
  const ApiClient(this.config);

  final AppConfig config;

  Uri endpoint(String path) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('${config.apiBaseUrl}$normalizedPath');
  }

  Future<List<dynamic>> getList(String path) async {
    final response = await http.get(endpoint(path));
    _throwIfUnsuccessful(response);
    return jsonDecode(response.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> getMap(String path) async {
    final response = await http.get(endpoint(path));
    _throwIfUnsuccessful(response);
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> postMap(
    String path,
    Map<String, dynamic> payload,
  ) async {
    final response = await http.post(
      endpoint(path),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    _throwIfUnsuccessful(response);
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  void _throwIfUnsuccessful(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        body: response.body,
      );
    }
  }
}

class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.body,
  });

  final int statusCode;
  final String body;

  @override
  String toString() => 'ApiException($statusCode): $body';
}
