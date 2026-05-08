import Link from "next/link";
import Image from "next/image";
import Account from "@/components/common/account";

export default function Header(){
    return (
        <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 px-2 hover:text-accent transition-colors">
              <Image
                src="/logo.png"
                alt="Logo"
                width={52}
                height={52}
                className="w-13 h-13 object-contain"
              />
              <span className="font-bold text-2xl">Lo de Charly</span>
            </Link>

            <Account />
          </div>
        </header>
    )
}