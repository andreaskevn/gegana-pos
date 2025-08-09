'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle } from "lucide-react";

type Transaksi = {
    transaksi_id: string;
    nama_customer: string;
    status_bayar: 'Lunas' | 'Belum Lunas';
    status_studio: 'Booked' | 'On Progress' | 'Selesai';
    total_harga: number;
    jumlah_bayar: number;
    sisa_bayar: number;
};

export default function DaftarTransaksiPage() {
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null);
    const [bayarSisa, setBayarSisa] = useState(0);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async (page: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/transaksi?page=${page}&limit=${itemsPerPage}`);
            if (!response.ok) throw new Error("Gagal mengambil data transaksi");
            const data = await response.json();
            setTransaksiList(data.transaksi || []);
            setTotalPages(data.totalPages || 1);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    const handleOpenPelunasanDialog = (transaksi: Transaksi) => {
        setSelectedTransaksi(transaksi);
        setBayarSisa(transaksi.sisa_bayar);
        setIsDialogOpen(true);
    };

    const handleStatusStudioChange = async (transaksiId: string, newStatus: string) => {
        setIsUpdatingStatus(transaksiId);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/transaksi/${transaksiId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status_studio: newStatus })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Gagal mengubah status studio");
            toast.success("Status studio berhasil diubah!");
            setTransaksiList(prevList => prevList.map(trx => trx.transaksi_id === transaksiId ? { ...trx, status_studio: newStatus as any } : trx));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handlePelunasan = async () => {
        if (!selectedTransaksi) return;
        if (!bayarSisa || bayarSisa <= 0) {
            toast.error("Jumlah pembayaran tidak valid.");
            return;
        }
        if (bayarSisa > selectedTransaksi.sisa_bayar) {
            toast.error("Jumlah pembayaran tidak boleh melebihi sisa tagihan.");
            return;
        }
        if (bayarSisa < selectedTransaksi.sisa_bayar) {
            toast.error("Jumlah pembayaran tidak kurang dari sisa tagihan.");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/transaksi/${selectedTransaksi.transaksi_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bayar_sisa: bayarSisa })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Gagal melakukan pelunasan");
            toast.success("Pembayaran berhasil disimpan!");
            setIsDialogOpen(false);
            fetchData(currentPage);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreviousPage = () => setCurrentPage(p => Math.max(p - 1, 1));
    const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
    const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Daftar Transaksi</h1>
                <Link href="/dashboard/transaksi/tambah">
                    <Button className="flex items-center gap-2"><PlusCircle className="h-4 w-4" />Tambah Transaksi</Button>
                </Link>
            </div>
            <Card>
                <CardHeader><CardTitle>Rekap Transaksi</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No.</TableHead>
                                <TableHead>Nama Customer</TableHead>
                                <TableHead>Status Bayar</TableHead>
                                <TableHead>Status Studio</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (<TableRow><TableCell colSpan={5} className="text-center">Memuat data...</TableCell></TableRow>) :
                                transaksiList.map((trx, index) => (
                                    <TableRow key={trx.transaksi_id}>
                                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                        <TableCell className="font-medium">{trx.nama_customer}</TableCell>
                                        <TableCell><Badge variant={trx.status_bayar === 'Lunas' ? 'default' : 'destructive'}>{trx.status_bayar}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {isUpdatingStatus === trx.transaksi_id && <Loader2 className="h-4 w-4 animate-spin" />}
                                                <Select defaultValue={trx.status_studio} onValueChange={(newStatus) => handleStatusStudioChange(trx.transaksi_id, newStatus)} disabled={isUpdatingStatus === trx.transaksi_id}>
                                                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Booked">Booked</SelectItem>
                                                        <SelectItem value="On Progress">On Progress</SelectItem>
                                                        <SelectItem value="Selesai">Selesai</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {trx.status_bayar === 'Belum Lunas' && (<Button onClick={() => handleOpenPelunasanDialog(trx)}>Lakukan Pelunasan</Button>)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage === 1}>Sebelumnya</Button>
                            <Button variant="outline" onClick={handleNextPage} disabled={currentPage === totalPages}>Berikutnya</Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pelunasan Transaksi</DialogTitle>
                        <DialogDescription>Untuk customer: <strong>{selectedTransaksi?.nama_customer}</strong></DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between"><span>Total Tagihan:</span> <span>{formatRupiah(selectedTransaksi?.total_harga || 0)}</span></div>
                        <div className="flex justify-between"><span>Sudah Dibayar:</span> <span>{formatRupiah(selectedTransaksi?.jumlah_bayar || 0)}</span></div>
                        <div className="flex justify-between font-bold text-red-600"><span>Sisa Tagihan:</span> <span>{formatRupiah(selectedTransaksi?.sisa_bayar || 0)}</span></div>
                        <Separator />
                        <div className="space-y-2">
                            <Label htmlFor="bayar-sisa">Jumlah Pembayaran Pelunasan</Label>
                            <Input id="bayar-sisa" type="number" value={bayarSisa} onChange={(e) => setBayarSisa(Number(e.target.value))} />
                            {selectedTransaksi && bayarSisa > selectedTransaksi.sisa_bayar && (<p className="text-xs text-destructive">Jumlah bayar melebihi sisa tagihan.</p>)}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                        <Button onClick={handlePelunasan} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Pembayaran
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}