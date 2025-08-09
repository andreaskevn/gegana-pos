'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, MinusCircle, Trash2, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SesiFromAPI = {
    sesi_id: string;
    nama: string;
    harga: number;
};

type AdditionalFromAPI = {
    additional_id: string;
    nama: string;
    harga: number;
};

type SelectedSesi = {
    sesi_id: string;
    nama: string;
    tanggal: Date;
    harga: number;
};

type SelectedAdditional = {
    additional_id: string;
    nama: string;
    harga: number;
    jumlah: number;
};

type DetailSesi = {
    sesi_id: string;
    tanggal_sesi: string;
};

type DetailTransaksi = {
    Detail_Transaksi_Sesi: DetailSesi[];
};

type TransaksiFromAPI = {
    transaksi_id: string;
    detailTransaksi: DetailTransaksi[];
};

export default function TambahTransaksiPage() {
    const router = useRouter();
    const [allSesi, setAllSesi] = useState<SesiFromAPI[]>([]);
    const [allAdditionals, setAllAdditionals] = useState<AdditionalFromAPI[]>([]);
    const [transaksiList, setTransaksiList] = useState<TransaksiFromAPI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [namaCustomer, setNamaCustomer] = useState('');
    const [nomorTelepon, setNomorTelepon] = useState('');
    const [tanggalSesi, setTanggalSesi] = useState<Date | undefined>(new Date());
    const [catatan, setCatatan] = useState('');

    const [selectedSesi, setSelectedSesi] = useState<SelectedSesi[]>([]);
    const [selectedAdditionals, setSelectedAdditionals] = useState<SelectedAdditional[]>([]);
    const [metodeBayar, setMetodeBayar] = useState('qris');
    const [paymentType, setPaymentType] = useState<'lunas' | 'dp'>('lunas');
    const [dpAmount, setDpAmount] = useState(50000);
    const [cashAmount, setCashAmount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [sesiRes, additionalRes, transaksiRes] = await Promise.all([
                    fetch('/api/sesi'),
                    fetch('/api/additional'),
                    fetch('/api/transaksi')
                ]);

                if (!sesiRes.ok || !additionalRes.ok || !transaksiRes.ok) {
                    throw new Error('Gagal mengambil data master');
                }

                const sesiData = await sesiRes.json();
                const additionalData = await additionalRes.json();
                const transaksiData = await transaksiRes.json();

                setAllSesi(sesiData.sesis || []);
                setAllAdditionals(additionalData.sesis || []);
                setTransaksiList(transaksiData.transaksi || []);

            } catch (error) {
                console.error(error);
                toast.error('Gagal memuat data Sesi & Additional.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const bookedSesiIds = useMemo(() => {
        if (!tanggalSesi || transaksiList.length === 0) return [];
        const selectedDateStr = tanggalSesi.toISOString().split('T')[0];
        const ids = new Set<string>();
        transaksiList.forEach(transaksi => {
            transaksi.detailTransaksi.forEach(detail => {
                detail.Detail_Transaksi_Sesi.forEach(sesiDetail => {
                    if (sesiDetail.tanggal_sesi.startsWith(selectedDateStr)) {
                        ids.add(sesiDetail.sesi_id);
                    }
                });
            });
        });
        return Array.from(ids);
    }, [transaksiList, tanggalSesi]);

    const totalHarga = useMemo(() => {
        const totalSesi = selectedSesi.reduce((sum, sesi) => sum + sesi.harga, 0);
        const totalAdditionals = selectedAdditionals.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);
        return totalSesi + totalAdditionals;
    }, [selectedSesi, selectedAdditionals]);

    const tagihanSaatIni = useMemo(() => {
        return paymentType === 'lunas' ? totalHarga : dpAmount;
    }, [paymentType, totalHarga, dpAmount]);

    const kembalian = useMemo(() => {
        if (metodeBayar === 'cash' && cashAmount > 0 && cashAmount >= tagihanSaatIni) {
            return cashAmount - tagihanSaatIni;
        }
        return 0;
    }, [cashAmount, tagihanSaatIni, metodeBayar]);

    const handleAddSesi = (sesi: SesiFromAPI) => {
        if (!tanggalSesi) {
            toast.warning("Silakan pilih tanggal terlebih dahulu.");
            return;
        }
        const isAlreadyAdded = selectedSesi.some(s => s.sesi_id === sesi.sesi_id && s.tanggal.toDateString() === tanggalSesi.toDateString());
        if (isAlreadyAdded) {
            toast.info(`${sesi.nama} pada tanggal tersebut sudah ditambahkan.`);
            return;
        }
        setSelectedSesi([...selectedSesi, { ...sesi, tanggal: tanggalSesi }]);
    };

    const handleRemoveSesi = (index: number) => {
        const newSesi = [...selectedSesi];
        newSesi.splice(index, 1);
        setSelectedSesi(newSesi);
    };

    const handleAddAdditional = (additional: AdditionalFromAPI) => {
        const existingItemIndex = selectedAdditionals.findIndex(a => a.additional_id === additional.additional_id);
        if (existingItemIndex > -1) {
            const newAdditionals = [...selectedAdditionals];
            newAdditionals[existingItemIndex].jumlah += 1;
            setSelectedAdditionals(newAdditionals);
        } else {
            setSelectedAdditionals([...selectedAdditionals, { ...additional, jumlah: 1 }]);
        }
    };

    const handleUpdateAdditionalJumlah = (index: number, action: 'tambah' | 'kurang') => {
        const newAdditionals = [...selectedAdditionals];
        if (action === 'tambah') {
            newAdditionals[index].jumlah += 1;
        } else {
            if (newAdditionals[index].jumlah > 1) {
                newAdditionals[index].jumlah -= 1;
            } else {
                newAdditionals.splice(index, 1);
            }
        }
        setSelectedAdditionals(newAdditionals);
    };

    const handleSubmit = async () => {
        if (!namaCustomer) {
            toast.warning("Nama customer tidak boleh kosong.");
            return;
        }
        if (selectedSesi.length === 0) {
            toast.warning("Minimal pilih satu sesi studio.");
            return;
        }
        if (metodeBayar === 'cash' && cashAmount < tagihanSaatIni) {
            toast.error("Jumlah uang tunai kurang dari tagihan saat ini.");
            return;
        }
        if (paymentType === 'dp' && dpAmount < 50000) {
            toast.error("Minimal DP adalah Rp 50.000.");
            return;
        }
        if (paymentType === 'dp' && dpAmount >= totalHarga) {
            toast.error("Jumlah DP tidak boleh sama atau lebih dari Total Harga.");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Sesi Anda tidak valid. Silakan login kembali.");
            setIsSubmitting(false);
            router.push('/login');
            return;
        }

        const jumlahBayarFinal = tagihanSaatIni;

        const payload = {
            nama_customer: namaCustomer,
            nomor_telepon: nomorTelepon,
            tanggal_transaksi: new Date().toISOString(),
            total_harga: totalHarga,
            jumlah_bayar: jumlahBayarFinal,
            metode_bayar: metodeBayar,
            catatan: catatan,
            status_studio: "Booked",
            detailTransaksi: [{
                subtotal: totalHarga,
                jumlah: 1,
                sesiDetails: selectedSesi.map(s => ({ sesi_id: s.sesi_id, tanggal_sesi: s.tanggal.toISOString() })),
                additionalItems: selectedAdditionals.map(a => ({ additional_id: a.additional_id, jumlah: a.jumlah })),
            }]
        };

        try {
            const response = await fetch('/api/transaksi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan pada server');

            toast.success('Transaksi berhasil dibuat!');
            router.push('/dashboard/transaksi');
        } catch (error: any) {
            toast.error(`Gagal menyimpan: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader><CardTitle>Informasi Pelanggan</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">Nama Customer</Label>
                            <Input id="customer-name" placeholder="cth: Budi Santoso" value={namaCustomer} onChange={(e) => setNamaCustomer(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-phone">Nomor Telepon</Label>
                            <Input id="customer-phone" placeholder="cth: 08123456789" value={nomorTelepon} onChange={(e) => setNomorTelepon(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pilih Sesi Studio</CardTitle>
                        <CardDescription>Sesi yang sudah dipesan tidak dapat dipilih.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="flex justify-center">
                            <Calendar mode="single" selected={tanggalSesi} onSelect={setTanggalSesi} className="rounded-md border" disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="font-semibold text-sm">Sesi tersedia untuk {tanggalSesi ? tanggalSesi.toLocaleDateString('id-ID') : '...'}:</p>
                            {isLoading ? <p>Memuat sesi...</p> : (
                                allSesi.map((sesi) => {
                                    const isBooked = bookedSesiIds.includes(sesi.sesi_id);
                                    return (
                                        <Button key={sesi.sesi_id} variant="outline" className='justify-between' onClick={() => handleAddSesi(sesi)} disabled={isBooked}>
                                            <span>{sesi.nama}</span>
                                            {isBooked ? (<Badge variant="destructive">Booked</Badge>) : (<span className='text-primary font-semibold'>{formatRupiah(sesi.harga)}</span>)}
                                        </Button>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Item Tambahan (Additional)</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {isLoading ? <p>Memuat item...</p> : allAdditionals.map(item => (
                            <Button key={item.additional_id} variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => handleAddAdditional(item)}>
                                <span className="text-center">{item.nama}</span>
                                <span className="text-xs text-muted-foreground">{formatRupiah(item.harga)}</span>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 sticky top-8">
                <Card>
                    <CardHeader><CardTitle>Rekap Pesanan</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {selectedSesi.length === 0 && selectedAdditionals.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-8">Belum ada item yang dipilih.</p>) : (
                            <>
                                {selectedSesi.length > 0 && (
                                    <div className='space-y-2'>
                                        <h4 className="font-semibold">Sesi Booking:</h4>
                                        {selectedSesi.map((sesi, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <div>
                                                    <p>{sesi.nama}</p>
                                                    <p className="text-xs text-muted-foreground">{sesi.tanggal.toLocaleDateString('id-ID')}</p>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <span>{formatRupiah(sesi.harga)}</span>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveSesi(index)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Separator />
                                {selectedAdditionals.length > 0 && (
                                    <div className='space-y-2'>
                                        <h4 className="font-semibold">Additional:</h4>
                                        {selectedAdditionals.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <p>{item.nama} <span className='text-muted-foreground'>x{item.jumlah}</span></p>
                                                <div className="flex items-center gap-2">
                                                    <span>{formatRupiah(item.harga * item.jumlah)}</span>
                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateAdditionalJumlah(index, 'kurang')}><MinusCircle className="h-3 w-3" /></Button>
                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateAdditionalJumlah(index, 'tambah')}><PlusCircle className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                            <span>Total Harga</span>
                            <span>{formatRupiah(totalHarga)}</span>
                        </div>
                        <Separator />
                        <div>
                            <Label>Opsi Pembayaran</Label>
                            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'lunas' | 'dp')} className="grid grid-cols-2 gap-4 mt-2">
                                <div><RadioGroupItem value="lunas" id="lunas" className="peer sr-only" /><Label htmlFor="lunas" className="flex items-center justify-center p-4 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Lunas</Label></div>
                                <div><RadioGroupItem value="dp" id="dp" className="peer sr-only" /><Label htmlFor="dp" className="flex items-center justify-center p-4 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">DP</Label></div>
                            </RadioGroup>
                        </div>
                        {paymentType === 'dp' && (
                            <div className="space-y-2">
                                <Label htmlFor='dp-amount'>Jumlah DP (Min. {formatRupiah(50000)})</Label>
                                <Input id="dp-amount" type="number" value={dpAmount} onChange={(e) => setDpAmount(Number(e.target.value))} />
                            </div>
                        )}
                        <div>
                            <Label>Metode Bayar</Label>
                            <RadioGroup value={metodeBayar} className="grid grid-cols-3 gap-4 mt-2" onValueChange={setMetodeBayar}>
                                <div><RadioGroupItem value="qris" id="qris" className="peer sr-only" /><Label htmlFor="qris" className="flex flex-col items-center justify-between p-4 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><QrCode className="mb-3 h-6 w-6" />QRIS</Label></div>
                                <div><RadioGroupItem value="cash" id="cash" className="peer sr-only" /><Label htmlFor="cash" className="flex flex-col items-center justify-between p-4 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><Banknote className="mb-3 h-6 w-6" />Cash</Label></div>
                                <div><RadioGroupItem value="transfer" id="transfer" className="peer sr-only" /><Label htmlFor="transfer" className="flex flex-col items-center justify-between p-4 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><CreditCard className="mb-3 h-6 w-6" />Transfer</Label></div>
                            </RadioGroup>
                        </div>
                        {metodeBayar === 'cash' && (
                            <div className="space-y-2 p-3 bg-muted rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tagihan Saat Ini</span>
                                    <span className="font-semibold">{formatRupiah(tagihanSaatIni)}</span>
                                </div>
                                <Label htmlFor="cash-amount">Uang Tunai Diterima</Label>
                                <Input id="cash-amount" type="number" value={cashAmount || ''} onChange={(e) => setCashAmount(Number(e.target.value))} placeholder="Masukkan jumlah uang tunai" />
                                {cashAmount > 0 && cashAmount < tagihanSaatIni && (<p className='text-xs text-destructive'>Uang tunai kurang dari tagihan.</p>)}
                                {kembalian > 0 && (<div className="text-sm font-medium text-green-600 pt-2">Kembalian: {formatRupiah(kembalian)}</div>)}
                            </div>
                        )}
                        <div className="space-y-2 mt-2">
                            <Label htmlFor="catatan">Catatan (Opsional)</Label>
                            <Textarea id="catatan" placeholder="cth: Minta sediakan stand mic tambahan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}