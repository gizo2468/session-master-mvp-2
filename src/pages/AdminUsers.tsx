import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
  is_premium: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note: This is an admin view - add proper role-based access control as needed
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data from profiles and private data tables
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          role,
          is_premium,
          created_at
        `);

      if (profilesError) {
        throw profilesError;
      }

      const { data: privateData, error: privateError } = await supabase
        .from('user_private_data')
        .select('id, email, full_name');

      if (privateError) {
        throw privateError;
      }

      // Combine the data
      const combinedUsers: UserData[] = profilesData.map(profile => {
        const privateInfo = privateData.find(pd => pd.id === profile.id);
        return {
          id: profile.id,
          email: privateInfo?.email || 'N/A',
          full_name: privateInfo?.full_name || 'N/A',
          username: profile.username || 'N/A',
          role: profile.role,
          is_premium: profile.is_premium,
          created_at: profile.created_at
        };
      });

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'coach':
        return 'default';
      case 'student':
        return 'secondary';
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-[300px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-destructive">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {users.length} users
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Premium User</TableHead>
                  <TableHead>Player/Coach</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_premium ? 'default' : 'secondary'}>
                        {user.is_premium ? 'Premium' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}