import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useConnection } from "wagmi";

export default function AuthMiddleware() {
    const connection = useConnection();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!connection.isConnected) {
            navigate("/", { replace: true, state: { from: location } });
        }
    }, [connection.isConnected, navigate, location]);

    if (!connection.isConnected) return null;

    return <Outlet />;
}
