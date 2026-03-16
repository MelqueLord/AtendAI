namespace Atendai.Application.Interfaces;

public interface IMetaEmbeddedSignupGateway
{
    Task<string> ExchangeCodeAsync(string code, CancellationToken cancellationToken = default);
}
