'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Home, Users, ShoppingCart, BarChart2, CalendarCheck,
    LogIn, LogOut, Loader2, CheckCircle
} from 'lucide-react';

// const menuItems = [
//     { href: '/dashboard', label: 'Dashboard', icon: Home },
//     { href: '/dashboard/users', label: 'User', icon: Users },
//     { href: '/dashboard/transaksi', label: 'Transaksi', icon: ShoppingCart },
//     { href: '/dashboard/laporan/transaksi', label: 'Laporan Transaksi', icon: BarChart2 },
//     { href: '/dashboard/laporan/presensi', label: 'Laporan Presensi', icon: CalendarCheck },
// ];
const allMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'user'] },
    { href: '/dashboard/users', label: 'User', icon: Users, roles: ['admin'] },
    { href: '/dashboard/transaksi', label: 'Transaksi', icon: ShoppingCart, roles: ['admin', 'user'] },
    { href: '/dashboard/laporan/transaksi', label: 'Laporan Transaksi', icon: BarChart2, roles: ['admin'] },
    { href: '/dashboard/laporan/presensi', label: 'Laporan Presensi', icon: CalendarCheck, roles: ['admin'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [hasClockedIn, setHasClockedIn] = useState(false);
    const [hasCompletedToday, setHasCompletedToday] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    const isToday = (someDate: Date) => {
        const today = new Date();
        return (
            someDate.getDate() === today.getDate() &&
            someDate.getMonth() === today.getMonth() &&
            someDate.getFullYear() === today.getFullYear()
        );
    };

    useEffect(() => {
        // Ambil role dari localStorage saat komponen dimuat
        const role = localStorage.getItem('user_role');
        setUserRole(role);
    }, []);

    // Filter menu berdasarkan role user
    const accessibleMenuItems = allMenuItems.filter(item =>
        item.roles.includes(userRole!)
    );


    useEffect(() => {
        const loggedInUsername = localStorage.getItem('username');
        if (loggedInUsername) {
            setUsername(loggedInUsername);
        }

        const checkPresensiStatus = async () => {
            setIsCheckingStatus(true);
            const token = localStorage.getItem('token');
            const loggedInUserId = localStorage.getItem('user_id');

            if (!token || !loggedInUserId) {
                toast.error("Sesi tidak valid. Silakan login kembali.");
                setIsCheckingStatus(false);
                router.push('/login');
                return;
            }

            try {
                const response = await fetch('/api/presensi', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Gagal mengambil data presensi');

                const data = await response.json();
                const allPresensi = data.presensi || [];
                const userPresensi = allPresensi.filter((p: any) => p.userId === loggedInUserId);

                if (userPresensi.length > 0) {
                    const lastPresensi = userPresensi[0];
                    const lastPresensiDate = new Date(lastPresensi.clock_in);

                    if (isToday(lastPresensiDate)) {
                        if (lastPresensi.clock_out === null) {
                            setHasClockedIn(true);
                            setHasCompletedToday(false);
                        } else {
                            setHasClockedIn(false);
                            setHasCompletedToday(true);
                        }
                    } else {
                        setHasClockedIn(false);
                        setHasCompletedToday(false);
                    }
                } else {
                    setHasClockedIn(false);
                    setHasCompletedToday(false);
                }

            } catch (error) {
                console.error("Gagal memeriksa status presensi:", error);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkPresensiStatus();
    }, [router]);

    const handleClockIn = async () => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/presensi', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gagal melakukan clock in');

            toast.success('Berhasil Clock In!');
            setHasClockedIn(true);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClockOut = async () => {
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/presensi', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Gagal melakukan clock out');

            toast.success('Berhasil Clock Out!');
            setHasClockedIn(false);
            setHasCompletedToday(true);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        toast.success('Anda telah logout.');
        router.push('/login');
    };

    return (
        <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r bg-background md:flex">
            <div className="flex h-16 items-center border-b px-6 bg-foreground">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-secondary">
                    <Image src="/logo3.png" alt="logo" width={50} height={50} />
                    <span>Studio Musik</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {accessibleMenuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                            { 'bg-muted text-primary': pathname === item.href }
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto flex flex-col p-4 border-t">
                <div className='text-sm font-semibold mb-2'>
                    Halo, {username || 'User'}!
                </div>
                <div className='flex flex-col gap-2'>
                    {isCheckingStatus ? (
                        <Button variant="outline" disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memeriksa...
                        </Button>
                    ) : hasClockedIn ? (
                        <Button variant="destructive" onClick={handleClockOut} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                            Clock Out
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={handleClockIn}
                            disabled={isProcessing || hasCompletedToday}
                        >
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!isProcessing && hasCompletedToday && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                            {!isProcessing && !hasCompletedToday && <LogIn className="mr-2 h-4 w-4" />}

                            {hasCompletedToday ? 'Presensi Selesai' : 'Clock In'}
                        </Button>
                    )}
                </div>

                <Separator className="my-4" />

                <Button variant="ghost" onClick={handleLogout} className='justify-start p-2 h-auto'>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}