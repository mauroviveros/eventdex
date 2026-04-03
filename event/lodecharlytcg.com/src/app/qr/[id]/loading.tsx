import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8">
      <Card className="highlight w-full max-w-2xl">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="mx-auto h-10 w-3/4" />
            <Skeleton className="mx-auto h-6 w-11/12" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>

          <Skeleton className="mx-auto h-5 w-2/3" />
        </CardContent>
      </Card>
    </section>
  );
}
