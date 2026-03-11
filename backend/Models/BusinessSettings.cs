namespace backend.Models;

public sealed class BusinessSettings
{
    public string BusinessName { get; set; } = "Seu Negocio";
    public string WelcomeMessage { get; set; } = "Oi, {cliente}. Sou o assistente virtual da {negocio}. Posso ajudar com informacoes e agendamentos.";
    public string HumanFallbackMessage { get; set; } = "Sua pergunta precisa de um especialista. Encaminhei para nossa equipe humana agora.";
    public List<TrainingEntry> TrainingEntries { get; init; } = [];
}
