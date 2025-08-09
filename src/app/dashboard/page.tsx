'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Users, ShoppingCart, CalendarClock, Loader2 } from 'lucide-react';

type SummaryData = {
  pendapatanBulanIni: number;
  totalTransaksiBulanIni: number;
  totalUsers: number;
  sesiBookingHariIni: number;
};

type TransaksiTerbaru = {
  transaksi_id: string;
  nama_customer: string;
  total_harga: number;
  status_bayar: string;
  tanggal_transaksi: string;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentTrx, setRecentTrx] = useState<TransaksiTerbaru[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) {
          throw new Error('Gagal mengambil data dashboard');
        }
        const data = await response.json();
        setSummary({
          pendapatanBulanIni: data.pendapatanBulanIni,
          totalTransaksiBulanIni: data.totalTransaksiBulanIni,
          totalUsers: data.totalUsers,
          sesiBookingHariIni: data.sesiBookingHariIni,
        });
        setRecentTrx(data.transaksiTerbaru || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Tampilan Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary?.pendapatanBulanIni || 0)}</div>
            <p className="text-xs text-muted-foreground">Berdasarkan semua transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summary?.totalTransaksiBulanIni || 0}</div>
            <p className="text-xs text-muted-foreground">Transaksi bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesi Booking Hari Ini</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.sesiBookingHariIni || 0} Sesi</div>
            <p className="text-xs text-muted-foreground">Jadwal untuk hari ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summary?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Total user terdaftar</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>Daftar 5 transaksi terakhir yang masuk.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status Bayar</TableHead>
                  <TableHead className="text-right">Total Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrx.length > 0 ? recentTrx.map((trx) => (
                  <TableRow key={trx.transaksi_id}>
                    <TableCell>
                      <div className="font-medium">{trx.nama_customer}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(trx.tanggal_transaksi)}</div>
                    </TableCell>
                    <TableCell>{trx.status_bayar}</TableCell>
                    <TableCell className="text-right">{formatRupiah(trx.total_harga)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Belum ada transaksi.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}