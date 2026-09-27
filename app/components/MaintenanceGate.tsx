"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

type MaintenanceGateProps = {
  isMaintenanceMode: boolean;
  children: ReactNode;
};

export function MaintenanceGate({
  isMaintenanceMode,
  children,
}: MaintenanceGateProps) {
  const { data: session, status } = useSession();

  if (!isMaintenanceMode) {
    return <>{children}</>;
  }

  const isAdmin = status === "authenticated" && session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] px-6 text-center">
        <div>
          <h1 className="mb-4 text-3xl font-bold text-slate-200">
            Under Maintenance
          </h1>
          <p className="text-slate-400">
            We are currently rolling out a major update. We will be right back.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
        Maintenance Mode Active
      </div>
      {children}
    </>
  );
}

export default MaintenanceGate;
