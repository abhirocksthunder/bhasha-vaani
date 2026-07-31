# Progress Event Versioning

Current supported schema version: `1`.

## Rules

- Clients must send `schema_version: 1`.
- The backend rejects unsupported future versions instead of guessing.
- Version bumps require:
  - schema documentation update
  - backend parser update
  - Flutter serializer update
  - migration or compatibility notes
  - tests for old, current, and rejected versions

Do not silently accept unknown event versions. Offline clients may replay old events later, so compatibility must be explicit.
