'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';

type User = {
  user_id: string;
  username: string;
  role: 'admin' | 'user';
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null); // State loading per baris
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user?page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data user');
      }
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Ambil user id yang sedang login untuk mencegah mengubah role diri sendiri
    const id = localStorage.getItem('user_id');
    setLoggedInUserId(id);
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    setIsUpdatingRole(userId);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mengubah role");

      toast.success(`Role untuk user berhasil diubah menjadi ${newRole}`);

      // Update data di state secara lokal untuk respons instan di UI
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.user_id === userId ? { ...user, role: newRole } : user
        )
      );

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingRole(null);
    }
  };


  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manajemen User</h1>
        <Link href="/dashboard/users/tambah">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Buat User Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Memuat data...</TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    {/* <TableCell className="text-muted-foreground">{user.role}</TableCell> */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isUpdatingRole === user.user_id && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleRoleChange(user.user_id, value as 'admin' | 'user')}
                          // Nonaktifkan jika sedang update atau jika user adalah diri sendiri
                          disabled={isUpdatingRole === user.user_id || user.user_id === loggedInUserId}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Belum ada user yang terdaftar.</TableCell>
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