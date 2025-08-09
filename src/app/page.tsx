import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 bg-background p-8 text-center md:w-1/2 md:items-start md:p-12 md:text-left">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl">
            Gegana Booking System
          </h1>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Gegana Booking Web-App Management
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button size="lg" className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Login ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
        <footer className="absolute bottom-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Gegana Studio.
        </footer>
      </div>

      <div className="hidden w-1/2 flex-1 md:block">
        
        <Image
          src="/hero-img.jpg"
          alt="Studio Musik"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
      </div>
    </main>
  );
}