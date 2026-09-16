import '../globals-classic.css';
import { ClassicProviders } from './providers';

export default function ClassicLayout({ children }: { children: React.ReactNode }) {
  return <ClassicProviders>{children}</ClassicProviders>;
}
