'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
            <Activity className="h-5 w-5 text-primary" />
            <span>Gyn-Vision</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/#features" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/#about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link href="/segmentation">
              <Button 
                size="sm" 
                variant={pathname === '/segmentation' ? 'default' : 'ghost'}
              >
                Segmentation
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button - Simple version */}
          <div className="md:hidden">
            <Link href="/segmentation">
              <Button size="sm">
                Segment
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
