import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import Authenticated from './Authenticated';
import ClientPage from '../LandingPage/ClientPage';

export default function Home() {
    const { isConnected } = useAccount();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isConnected) return;

        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
        if (from && from !== '/') {
            navigate(from, { replace: true });
        }
    }, [isConnected, location.state, navigate]);

    return isConnected ? <Authenticated /> : <ClientPage />
}
