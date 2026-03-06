import { Navigate } from "react-router-dom";
import { useStoreContext } from "./contextApi/ContextApi";

interface PrivateRouteProps {
  children: React.ReactNode;
  publicPage?: boolean;
}

export default function PrivateRoute({ children, publicPage }: PrivateRouteProps) {
  const { token } = useStoreContext();

  if (publicPage) {
    return token ? <Navigate to="/dashboard" /> : <>{children}</>;
  }

  return !token ? <Navigate to="/login" /> : <>{children}</>;
}
