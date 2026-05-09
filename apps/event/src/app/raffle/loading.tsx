import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RaffleLoading() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-press-start text-3xl text-center">Sorteo del Evento</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <div className="text-lg">Total de participantes: <Skeleton className="inline-block w-12 h-6" /></div>
            <div className="text-lg">Total de spots coleccionados: <Skeleton className="inline-block w-12 h-6" /></div>
          </CardContent>
        </Card>

        <div className="space-y-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel de participantes */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="font-press-start text-lg">Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-12 h-6 rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Panel de ganador */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="font-press-start text-lg">Sorteo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 min-h-48">
                <div className="flex flex-col items-center justify-center gap-2 h-full w-full">
                  <Skeleton className="w-16 h-16 rounded" />
                  <Skeleton className="w-48 h-4" />
                  <Skeleton className="w-40 h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Skeleton className="w-full h-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}
