using Atendai.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Middleware;

public sealed class GlobalExceptionMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, detail, shouldLogAsError) = exception switch
        {
            ApplicationValidationException => (StatusCodes.Status400BadRequest, "Requisicao invalida", exception.Message, false),
            ApplicationForbiddenException => (StatusCodes.Status403Forbidden, "Acesso negado", exception.Message, false),
            BusinessRuleViolationException => (StatusCodes.Status409Conflict, "Regra de negocio violada", exception.Message, false),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Recurso nao encontrado", exception.Message, false),
            ArgumentException => (StatusCodes.Status400BadRequest, "Requisicao invalida", exception.Message, false),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Operacao nao permitida", exception.Message, false),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Acesso negado", exception.Message, false),
            _ => (StatusCodes.Status500InternalServerError, "Erro interno do servidor", "Ocorreu um erro interno ao processar a solicitacao.", true)
        };

        if (shouldLogAsError)
        {
            logger.LogError(exception, "Unhandled exception while processing request {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Handled exception while processing request {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await context.Response.WriteAsJsonAsync(problem, cancellationToken: context.RequestAborted);
    }
}
