import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/authService";

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("USER");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = AuthService.isAuthenticated();
      const userRole = AuthService.getRole();
      setIsAuthenticated(isAuth);
      setRole(userRole);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setRole("USER");
    router.push("/login/admin");
  };

  return { isAuthenticated, role, isLoading, logout };
}

export function ProtectedRoute({
  children,
  requireAdmin,
  requireIT,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireIT?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = AuthService.isAuthenticated();
      const userRole = AuthService.getRole();

      if (!isAuth) {
        router.push("/login/admin");
        return;
      }

      if (requireAdmin && userRole !== "ADMIN") {
        router.push("/tickets");
        return;
      }

      if (requireIT && userRole !== "IT" && userRole !== "ADMIN") {
        router.push("/tickets");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, requireAdmin, requireIT]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <svg
            className="w-12 h-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4a8 8 0 018 8m0 0a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
