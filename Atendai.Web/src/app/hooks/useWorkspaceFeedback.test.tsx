import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWorkspaceFeedback } from "@app/hooks/useWorkspaceFeedback";

describe("useWorkspaceFeedback", () => {
  it("superficie o erro de restauracao e limpa o buffer", () => {
    const setError = vi.fn();
    const clearSessionRestoreError = vi.fn();

    renderHook(() => useWorkspaceFeedback({
      notice: "",
      setNotice: vi.fn(),
      error: "",
      setError,
      sessionRestoreError: "Sessao expirada",
      clearSessionRestoreError
    }));

    expect(setError).toHaveBeenCalledWith("Sessao expirada");
    expect(clearSessionRestoreError).toHaveBeenCalled();
  });
});
