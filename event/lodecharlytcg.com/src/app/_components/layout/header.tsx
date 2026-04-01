import { Account } from "@/components/account";
import { Suspense } from "react";

export const Header = () => (
  <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-sm">
    <div className="container mx-auto h-16 flex items-center justify-end gap-4">
      <Suspense>
        <Account />
      </Suspense>
    </div>
  </header>
);
