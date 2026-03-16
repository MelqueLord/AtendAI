namespace Atendai.Application.Exceptions;

public sealed class BusinessRuleViolationException(string message) : Exception(message);
