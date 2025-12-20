import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, RefreshCw, Crown } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';

interface UserWithSubscription {
  user_id: string;
  email: string | null;
  full_name: string | null;
  has_subscription: boolean | null;
}

export const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Query the view directly using service role through edge function
      // For now, we'll use a workaround since the view inherits RLS
      const { data, error } = await supabase
        .from('user_with_subscription_status')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    setTogglingUsers(prev => new Set(prev).add(userId));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const response = await supabase.functions.invoke('admin-toggle-premium', {
        body: {
          target_user_id: userId,
          set_premium: !currentStatus
        }
      });

      if (response.error) {
        console.error('Toggle error:', response.error);
        toast.error(response.error.message || 'Failed to toggle premium status');
        return;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.user_id === userId 
          ? { ...user, has_subscription: !currentStatus }
          : user
      ));

      toast.success(`Premium ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Failed to toggle premium:', err);
      toast.error('Failed to toggle premium status');
    } finally {
      setTogglingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <PageContainer>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Users Management</h1>
            <p className="text-muted-foreground text-sm">Manage user premium subscriptions</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Premium Status Toggle
            </CardTitle>
            <CardDescription>
              Toggle premium status for users. Changes take effect immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Premium</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.email || 'No email'}
                        </TableCell>
                        <TableCell>
                          {user.full_name || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {togglingUsers.has(user.user_id) ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            <Switch
                              checked={user.has_subscription ?? false}
                              onCheckedChange={() => handleTogglePremium(
                                user.user_id,
                                user.has_subscription ?? false
                              )}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default UsersManagement;
