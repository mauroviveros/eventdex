import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPerfil() {
  return (
    <>
      <Card size="sm" className="highlight m-4">
        <CardContent className="grid gap-4 grid-cols-[auto_1fr]">
          <Skeleton className="h-25 w-25" />

          <article className="min-w-0 space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-6 w-full" />
          </article>

          <div className="col-span-2 sm:col-span-1 flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="my-4">
        <CardHeader>
          <Skeleton className="h-7 w-56 mx-auto" />
        </CardHeader>

        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2 w-32">
              <Skeleton className="w-32 h-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
