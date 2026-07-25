import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";

const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setIsLoading(false);
    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rs-page">
        <div className="h-8 w-8 animate-pulse rounded-md bg-rs-border" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
