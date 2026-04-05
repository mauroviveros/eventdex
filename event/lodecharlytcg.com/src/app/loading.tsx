import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-2 py-8">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4">
        <Card size="sm" className="mx-4 w-full max-w-md">
          <CardContent className="flex items-center gap-2 py-3">
            <Skeleton className="size-5" />
            <Skeleton className="h-6 w-48" />
          </CardContent>
        </Card>

        <Card className="highlight z-10 w-full max-w-2xl">
          <CardContent className="space-y-2 px-2 py-4 text-center">
            <Skeleton className="h-8 w-4/5 mx-auto" />
            <Skeleton className="h-4 w-11/12 mx-auto" />
          </CardContent>
        </Card>

        <Card size="sm" className="mx-4 w-full max-w-md">
          <CardContent className="space-y-2 py-3">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
