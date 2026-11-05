import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Link from "next/link";

interface AuthComponentProps {
  onSuccess: () => void;
}

const Login = dynamic<AuthComponentProps>(
  () => import("@/components/auth/Login").then((mod) => mod.default),
  { ssr: false }
);

export default function Auth() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-page px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-rs-border bg-rs-surface p-8 shadow-none">
          <Login onSuccess={handleSuccess} />
          <div className="mt-6 text-center">
            <p className="text-xs text-rs-text-muted">
              Are you a listener?{" "}
              <Link
                href="/listener/login"
                className="font-medium text-rs-blue hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
