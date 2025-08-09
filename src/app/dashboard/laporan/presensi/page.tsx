'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { Download, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Tipe data yang kita harapkan dari API yang sudah diperbarui
type PresensiRecord = {
  id: string;
  user: {
    username: string;
  };
  clock_in: string; // ISO String
  clock_out: string | null; // Bisa jadi null jika belum clock out
};

export default function LaporanPresensiPage() {
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDownloading, setIsDownloading] = useState(false);

  // State baru untuk pagination dan date range
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7), // Default: 7 hari terakhir
    to: new Date(),
  });
  const itemsPerPage = 10;

  const handleDownloadPDF = async () => {
    if (presensiList.length === 0) {
      toast.warning("Tidak ada data untuk diunduh.");
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast.warning("Silakan pilih rentang tanggal terlebih dahulu.");
      return;
    }

    setIsDownloading(true);
    try {
      // 1. Fetch data sesuai rentang tanggal
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();
      const response = await fetch(`/api/presensi?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error("Gagal mengambil data untuk PDF");

      const data = await response.json();
      const dataForPDF = data.presensi || [];

      if (dataForPDF.length === 0) {
        toast.info("Tidak ada data presensi pada rentang tanggal yang dipilih.");
        return;
      }

      // 2. Buat dokumen PDF
      const doc = new jsPDF();
      const tableColumns = ["No.", "Nama User", "Tanggal", "Clock In", "Clock Out"];
      const tableRows: any[] = [];

      dataForPDF.forEach((presensi: PresensiRecord, index: number) => {
        const presensiData = [
          index + 1,
          presensi.user.username,
          formatDate(presensi.clock_in),
          `${formatTime(presensi.clock_in)} WIB`,
          presensi.clock_out ? `${formatTime(presensi.clock_out)} WIB` : 'Masih Bekerja'
        ];
        tableRows.push(presensiData);
      });

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 28,
        didDrawPage: (data) => {
          doc.setFontSize(20);
          doc.text("Laporan Presensi", data.settings.margin.left, 15);
          doc.setFontSize(10);
          doc.text(
            `Periode: ${format(dateRange.from!, "dd MMM yyyy")} - ${format(dateRange.to!, "dd MMM yyyy")}`,
            data.settings.margin.left,
            20
          );
        }
      });

      doc.save(`laporan-presensi-${format(dateRange.from!, "yyyy-MM-dd")}_${format(dateRange.to!, "yyyy-MM-dd")}.pdf`);
      toast.success("PDF berhasil dibuat!");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fungsi untuk mengambil data presensi
  useEffect(() => {
    const fetchPresensi = async (page: number) => {
      setIsLoading(true);
      const token = localStorage.getItem('token'); // Diperlukan jika API Anda terproteksi
      try {
        const response = await fetch(`/api/presensi?page=${page}&limit=${itemsPerPage}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Gagal mengambil data laporan presensi');
        }
        const data = await response.json();
        setPresensiList(data.presensi || []);
        setTotalPages(data.totalPages || 1);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresensi(currentPage);
  }, [currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Fungsi helper untuk format tanggal dan waktu
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laporan Presensi</h1>
      {/* <Button onClick={handleDownloadPDF} disabled={isLoading}>
        <Download className="mr-2 h-4 w-4" />
        Unduh PDF
      </Button> */}
      <div className='flex items-center gap-2'>
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {/* Tombol Unduh */}
        <Button onClick={handleDownloadPDF} disabled={isLoading || isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Unduh PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Kehadiran User</CardTitle>
          <CardDescription>
            Berikut adalah daftar riwayat kehadiran yang tercatat dalam sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Nama User</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : presensiList.length > 0 ? (
                presensiList.map((presensi, index) => (
                  <TableRow key={presensi.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{presensi.user.username}</TableCell>
                    <TableCell>{formatDate(presensi.clock_in)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatTime(presensi.clock_in)} WIB</Badge>
                    </TableCell>
                    <TableCell>
                      {presensi.clock_out ? (
                        <Badge variant="outline">{formatTime(presensi.clock_out)} WIB</Badge>
                      ) : (
                        <Badge variant="destructive">Masih Bekerja</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Belum ada data presensi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}