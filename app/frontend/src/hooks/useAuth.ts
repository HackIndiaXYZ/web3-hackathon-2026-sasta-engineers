import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { LoginRequest, RegisterRequest, WalletConnectRequest } from '@/types';
import { handleApiError } from '@/lib/axios';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, logout: logoutStore, user, isAuthenticated } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Login successful!');
      
      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'ISSUER') {
        router.push('/issuer/dashboard');
      } else if (data.user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Registration successful!');
      
      // Redirect based on role
      if (data.user.role === 'ISSUER') {
        router.push('/issuer/register');
      } else if (data.user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Wallet connect mutation
  const walletConnectMutation = useMutation({
    mutationFn: (data: WalletConnectRequest) => authService.walletConnect(data),
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Wallet connected successfully!');
      
      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'ISSUER') {
        router.push('/issuer/dashboard');
      } else if (data.user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: (error) => {
      // Still logout locally even if API call fails
      logoutStore();
      queryClient.clear();
      router.push('/login');
    },
  });

  // Get profile query
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    retry: false,
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    walletConnect: walletConnectMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isConnectingWallet: walletConnectMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
  };
}
