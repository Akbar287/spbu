import { useAccount } from 'wagmi'
import Authenticated from './Authenticated';
import ClientPage from '../landing-page/ClientPage';

export default function Home() {
    const { isConnected } = useAccount();
    return isConnected ? <Authenticated /> : <ClientPage />
}
