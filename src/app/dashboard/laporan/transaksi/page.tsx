'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon, Loader2, DollarSign, ShoppingCart } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';

// Tipe Data
type Transaksi = {
    transaksi_id: string;
    nama_customer: string;
    tanggal_transaksi: string;
    total_harga: number;
    status_bayar: 'Lunas' | 'Belum Lunas';
};

type SummaryData = {
    totalPendapatan: number;
    totalTransaksi: number;
};

export default function LaporanTransaksiPage() {
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ totalPendapatan: 0, totalTransaksi: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Awal bulan ini
        to: new Date(),
    });
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchTransaksi = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');

            let url = `/api/transaksi?page=${currentPage}&limit=${itemsPerPage}`;
            if (dateRange?.from && dateRange?.to) {
                url += `&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
            }

            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Gagal mengambil data laporan transaksi');

                const data = await response.json();
                setTransaksiList(data.transaksi || []);
                setTotalPages(data.totalPages || 1);
                setSummary({
                    totalPendapatan: data.totalPendapatan || 0,
                    totalTransaksi: data.totalTransaksi || 0,
                });
            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransaksi();
    }, [currentPage, dateRange]);

    const handleDownloadPDF = async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast.warning("Silakan pilih rentang tanggal.");
            return;
        }

        setIsDownloading(true);
        let url = `/api/transaksi?download=true&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Gagal mengambil data untuk PDF");

            const data = await response.json();
            const dataForPDF = data.transaksi || [];

            if (dataForPDF.length === 0) {
                toast.info("Tidak ada transaksi pada rentang tanggal yang dipilih.");
                return;
            }

            const doc = new jsPDF();
            const tableColumns = ["No.", "Customer", "Tanggal", "Status Bayar", "Total Harga"];
            const tableRows: any[] = [];
            dataForPDF.forEach((trx: Transaksi, index: number) => {
                tableRows.push([
                    index + 1,
                    trx.nama_customer,
                    formatDate(trx.tanggal_transaksi),
                    trx.status_bayar,
                    formatRupiah(trx.total_harga)
                ]);
            });

            autoTable(doc, {
                head: [tableColumns], body: tableRows, startY: 28,
                didDrawPage: (data) => {
                    doc.setFontSize(18); doc.text("Laporan Transaksi", 14, 15);
                    doc.setFontSize(10); doc.text(`Periode: ${format(dateRange.from!, "dd MMM yyyy")} - ${format(dateRange.to!, "dd MMM yyyy")}`, 14, 22);
                }
            });
            doc.save(`laporan-transaksi-${format(dateRange.from!, "yyyy-MM-dd")}.pdf`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Laporan Transaksi</h1>
                <div className='flex items-center gap-2'>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pilih tanggal</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleDownloadPDF} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(summary.totalPendapatan)}</div>
                        <p className="text-xs text-muted-foreground">Pada periode yang dipilih</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{summary.totalTransaksi}</div>
                        <p className="text-xs text-muted-foreground">Pada periode yang dipilih</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Detail Transaksi</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Status Bayar</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (<TableRow><TableCell colSpan={4} className="text-center">Memuat data...</TableCell></TableRow>)
                                : transaksiList.length > 0 ? (
                                    transaksiList.map((trx) => (
                                        <TableRow key={trx.transaksi_id}>
                                            <TableCell className="font-medium">{trx.nama_customer}</TableCell>
                                            <TableCell>{formatDate(trx.tanggal_transaksi)}</TableCell>
                                            <TableCell><Badge variant={trx.status_bayar === 'Lunas' ? 'default' : 'destructive'}>{trx.status_bayar}</Badge></TableCell>
                                            <TableCell className="text-right">{formatRupiah(trx.total_harga)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (<TableRow><TableCell colSpan={4} className="text-center">Tidak ada transaksi pada periode ini.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Sebelumnya</Button>
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Berikutnya</Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}