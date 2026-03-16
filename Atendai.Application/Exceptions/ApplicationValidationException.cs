namespace Atendai.Application.Exceptions;

public sealed class ApplicationValidationException(string message) : Exception(message);
