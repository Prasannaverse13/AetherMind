import Link from 'next/link';
import { WalletConnect } from '@/components/aethermind/WalletConnect';
import { AetherMindLogo } from '@/components/icons/AetherMindLogo';

export function Header() {
  return (
    <header className="py-6 bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <AetherMindLogo className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            AetherMind
          </h1>
        </Link>
        <WalletConnect />
      </div>
    </header>
  );
}
