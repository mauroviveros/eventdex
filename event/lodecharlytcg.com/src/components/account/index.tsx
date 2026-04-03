"use client";

import dynamic from "next/dynamic";

const Account = dynamic(() => import("./account"), {
  ssr: false,
});

export default Account;
