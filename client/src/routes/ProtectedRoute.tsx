import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-concrete-50 text-concrete-700">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
