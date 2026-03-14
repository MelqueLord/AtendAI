import { AuthProvider } from "@app/providers/AuthProvider";
import { QueryProvider } from "@app/providers/QueryProvider";
import { AppRouter } from "@app/router";
import { ThemeProvider } from "@app/providers/ThemeProvider";

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
