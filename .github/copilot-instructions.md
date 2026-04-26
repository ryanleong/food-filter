
See `docs/PRD.md` for more details on the product requirements and design principles.

**Always** keep business logic separate from presentation logic. This means that you should not mix code that handles user interface (UI) interactions with code that performs data processing or business rules.

Instead, use a clear separation of concerns by organizing your code into different layers or modules, such as a service layer for business logic and a controller layer for handling UI interactions. This approach promotes maintainability, testability, and scalability in your codebase.