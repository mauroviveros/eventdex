import { useEffect, useState } from "react";
import { supabase } from "@lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { Icon } from "@iconify/react";

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session").then(async (res) => {
      const session: Session | null = await res.json();
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  // TODO loading state
  // <div className="flex items-center gap-2 px-4 py-2">
  //   <div className="animate-pulse w-8 h-8 bg-gray-300 rounded"></div>
  //   <div className="hidden xl:block animate-pulse w-24 h-6 bg-gray-300 rounded"></div>
  // </div>

  return (
    <article className="flex items-center bg-secondary/80 text-secondary-foreground hover:bg-secondary/85 h-full max-w-64">
      {!loading && user && (
        <a href="/profile" type="button" className="px-4 py-2 flex items-center gap-2">
          <img src={user.user_metadata.avatar_url || 'placeholder.svg'} alt="" className="size-8 border-2 border-accent shrink-0"/>
          <div className="flex-col hidden xl:flex">
            <span className="text-lg leading-5 font-bold truncate w-full text-left">{user.user_metadata.full_name}</span>
            <span className="leading-3 opacity-70 truncate w-full text-left">{user.email}</span>
          </div>
          <Icon icon="tabler:chevron-down"/>
        </a>
      )}

      {!loading && !user && (
        <form action="/api/auth/signin" method="POST" className="">
          <input type="hidden" name="provider" value="google" className="h-full"/>
          <button type="submit" className="flex items-center gap-2 h-full px-4 py-2 cursor-pointer">
            <Icon icon="devicon:google" width="1.75rem" height="1.75rem" className="p-1 rounded-full bg-white"/>
            <span className="hidden xl:block text-xl font-bold">Iniciar sesión</span>
          </button>
        </form>
      )}
    </article>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  // if (user) {
  //   return (
  //     <div className="flex items-center space-x-2">
  //       <img
  //         src={user.user_metadata.avatar_url || '/default-avatar.png'}
  //         alt="User Avatar"
  //         className="w-8 h-8 rounded-full"
  //       />
  //       <span className="font-medium">{user.user_metadata.full_name || user.email}</span>
  //     </div>
  //   );
  // } else {
  //   return (
  //     <form action="/api/auth/signin" method="POST" className="bg-secondary/80 text-secondary-foreground hover:bg-secondary/85 h-full max-w-64">
  //       <input type="hidden" name="provider" value="google" />
  //       <button type="submit" className="flex items-center gap-2 h-full px-4 py-2 cursor-pointer">
  //         <Icon icon="devicon:google" width="1.75rem" height="1.75rem" className="p-1 rounded-full bg-white"/>
  //         <span className="hidden xl:block text-xl font-bold">Iniciar sesión</span>
  //       </button>
  //     </form>
  //   )
  // }
}

// ---
// import { Icon } from 'astro-icon/components';
// interface Props { loggedin?: boolean; }
// const { loggedin = false } = Astro.props;
// ---
// <a href={loggedin ? "/profile" : "/loggedin"} class="bg-secondary/80 text-secondary-foreground hover:bg-secondary/85 h-full max-w-64">

//     <button class="flex items-center gap-2 h-full px-4 py-2 cursor-pointer">
//       {
//         loggedin ?
//           (
//             <img src="placeholder.svg" alt="" class="size-8 border-2 border-accent shrink-0"/>
//             <div class="flex-col hidden xl:flex">
//               <span class="text-lg leading-5 font-bold truncate w-full text-left">Mauro Daniel Viveros</span>
//               <span class="leading-3 opacity-70 truncate w-full text-left">maurod.viveros@gmail.com</span>
//             </div>
//             <Icon name="tabler:chevron-down"/>

//           ) : (
//             <Icon name="devicon:google" size="1.75rem" class="p-1 rounded-full bg-white"/>
//             <span class="hidden xl:block text-xl font-bold">Iniciar sesión</span>
//           )
//       }
//     </button>

// </a>
