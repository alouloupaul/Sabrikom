# API behavior tests

Run from the repository root with .NET 8:

```sh
dotnet test Sabrikom.sln
```

These HTTP integration tests run the application's routing, JWT authentication,
authorization, Identity, controllers, and EF Core persistence in-process. Each test
owns an isolated SQLite in-memory database and uses a test-only JWT signing key;
no MySQL server, Docker stack, or project secrets are required.

Coverage focuses on refresh rotation/replay and logout, account/role checks,
listing ownership and moderation visibility, and private message isolation/read
state. SQLite enforces relational constraints, but these tests do not validate
MySQL migrations or provider-specific query behavior.
