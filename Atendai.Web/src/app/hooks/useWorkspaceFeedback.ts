import { useEffect, type Dispatch, type SetStateAction } from "react";

type UseWorkspaceFeedbackParams = {
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  sessionRestoreError: string;
  clearSessionRestoreError: () => void;
};

export function useWorkspaceFeedback({
  notice,
  setNotice,
  error,
  setError,
  sessionRestoreError,
  clearSessionRestoreError
}: UseWorkspaceFeedbackParams) {
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => setError(""), 8000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  useEffect(() => {
    if (!sessionRestoreError) {
      return;
    }

    setError(sessionRestoreError);
    clearSessionRestoreError();
  }, [clearSessionRestoreError, sessionRestoreError, setError]);
}
