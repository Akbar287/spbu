import { useAccount } from 'wagmi'
import Authenticated from './Authenticated';
import ClientPage from '../LandingPage/ClientPage';

export default function Home() {
    const { isConnected } = useAccount();
    return isConnected ? <Authenticated /> : <ClientPage />
}
