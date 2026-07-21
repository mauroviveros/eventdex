import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth";
import { resolveSafeNextPath } from "@/utils";
import { signInWithGoogle } from "./actions";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
    <path
      fill="currentColor"
      d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.6 3.9-5.35 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 3.95 1.55l2.15-2.15A9 9 0 1 0 12 21c5.2 0 8.85-3.65 8.85-8.8 0-.37-.03-.74-.1-1.1Z"
    />
  </svg>
);

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const next = resolveSafeNextPath(
    typeof params.next === "string" ? params.next : null,
  );

  if (user) redirect(next);

  const hasError = typeof params.error === "string";

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Eventdex Admin</CardTitle>
          <CardDescription>
            Ingresá con tu cuenta de organizador para administrar tus eventos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={signInWithGoogle.bind(null, next)}>
            <Button type="submit" className="w-full gap-2">
              <GoogleIcon />
              Continuar con Google
            </Button>
          </form>
          {hasError && (
            <p className="text-center text-destructive text-sm">
              No pudimos iniciar sesión. Probá de nuevo.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
