namespace Atendai.Application.Exceptions;

public sealed class ApplicationForbiddenException(string message) : Exception(message);
