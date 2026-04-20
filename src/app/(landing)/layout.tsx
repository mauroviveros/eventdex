import { Metadata } from 'next';
import Header from './_components/header';
import "@/styles/eventdex.css";



export const metadata: Metadata = {
  title: "Eventdex - Transforma tus eventos físicos en experiencias interactivas",
  description: "Los visitantes escanean códigos QR, obtienen insignias, completan recorridos y se mantienen activos. Todo esto mientras usted recibe análisis en tiempo real e información útil para la toma de decisiones.",
}

type Props = Readonly<{ children: React.ReactNode }>;
export default function Layout({ children }: Props) {
  return (<>
    <Header/>

    <main>
      {children}
    </main>
  </>)
}
