import '../globals-neob.css';
import { NeoBProviders } from './providers';

export default function NeoBLayout({ children }: { children: React.ReactNode }) {
  return <NeoBProviders>{children}</NeoBProviders>;
}
