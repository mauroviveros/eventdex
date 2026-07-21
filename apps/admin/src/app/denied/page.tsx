import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser, getMembership } from "@/server/auth";

export default async function DeniedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Si en realidad es organizador (p. ej. lo agregaron recién), no tiene nada
  // que hacer acá.
  const membership = await getMembership(user.id);
  if (membership) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sin acceso</CardTitle>
          <CardDescription>
            La cuenta <span className="font-medium">{user.email}</span> no
            pertenece a ninguna organización. Pedile a un administrador que te
            agregue, o entrá con otra cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
