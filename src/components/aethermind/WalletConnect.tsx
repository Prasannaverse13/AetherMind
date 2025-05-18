"use client";

import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function WalletConnect() {
  const { isConnected, account, connectWallet, disconnectWallet, loading } = useWallet();

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && account) {
    const shortAccount = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
             <Avatar className="h-6 w-6">
              <AvatarImage src={`https://avatar.vercel.sh/${account}.png`} alt={account} />
              <AvatarFallback>{account.substring(2,4).toUpperCase()}</AvatarFallback>
            </Avatar>
            {shortAccount}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass-card">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>{shortAccount}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnectWallet} className="text-destructive focus:bg-destructive/20 focus:text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={connectWallet} variant="default" className="shadow-md hover:shadow-lg transition-shadow">
      <LogIn className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
