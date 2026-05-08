import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-1 py-8">
      <Card className="highlight w-full max-w-2xl">
        <CardContent className="space-y-6 px-2 py-8 flex flex-col items-center justify-center">
          <div className="space-y-2 text-center">
            <Skeleton className="h-10 w-72 mx-auto" />
          </div>

          <div className="size-32 flex items-center justify-center pixel-border-sm">
            <Skeleton className="size-full rounded-none" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
