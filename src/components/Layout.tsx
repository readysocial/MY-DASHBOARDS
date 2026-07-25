import { useEffect } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-rs-page">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-rs-page">
        <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
