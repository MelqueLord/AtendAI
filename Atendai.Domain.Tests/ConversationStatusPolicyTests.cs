using Atendai.Domain.Entities;
using Atendai.Domain.Rules;

namespace Atendai.Domain.Tests;

public sealed class ConversationStatusPolicyTests
{
    [Theory]
    [InlineData("BotHandling", ConversationStatus.BotHandling)]
    [InlineData("waitinghuman", ConversationStatus.WaitingHuman)]
    [InlineData("HumanHandling", ConversationStatus.HumanHandling)]
    [InlineData("closed", ConversationStatus.Closed)]
    public void TryParse_ReturnsExpectedStatus_ForSupportedValues(string input, ConversationStatus expected)
    {
        var parsed = ConversationStatusPolicy.TryParse(input, out var status);

        Assert.True(parsed);
        Assert.Equal(expected, status);
    }

    [Theory]
    [InlineData("")]
    [InlineData("archived")]
    [InlineData("pending")]
    public void TryParse_ReturnsFalse_ForUnsupportedValues(string input)
    {
        var parsed = ConversationStatusPolicy.TryParse(input, out _);

        Assert.False(parsed);
    }

    [Theory]
    [InlineData(ConversationStatus.BotHandling, ConversationStatus.WaitingHuman, true)]
    [InlineData(ConversationStatus.WaitingHuman, ConversationStatus.HumanHandling, true)]
    [InlineData(ConversationStatus.Closed, ConversationStatus.WaitingHuman, false)]
    [InlineData(ConversationStatus.HumanHandling, ConversationStatus.Closed, true)]
    public void CanTransition_RespectsBusinessRules(ConversationStatus current, ConversationStatus next, bool expected)
    {
        var allowed = ConversationStatusPolicy.CanTransition(current, next);

        Assert.Equal(expected, allowed);
    }
}
