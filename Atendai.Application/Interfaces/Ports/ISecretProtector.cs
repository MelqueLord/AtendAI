namespace Atendai.Application.Interfaces;

public interface ISecretProtector
{
    string Protect(string value);
    string? UnprotectOrNull(string? value);
}
