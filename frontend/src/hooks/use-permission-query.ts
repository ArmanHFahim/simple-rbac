import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'

import { useAuthStore, hasAnyPermission } from '@/stores/auth-store'

interface PermissionQueryConfig<TData> {
  permissions: string[]
  queryKey: unknown[]
  queryFn: () => Promise<TData>
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn' | 'enabled'>
  enabled?: boolean
}

export function usePermissionQuery<TData>({
  permissions,
  queryKey,
  queryFn,
  options = {},
  enabled = true,
}: PermissionQueryConfig<TData>) {
  const { user, isLoading: isAuthLoading } = useAuthStore()

  const permissionsLoaded = !isAuthLoading && Array.isArray(user?.permissions)
  const hasAccess = hasAnyPermission(user, permissions)
  const isEnabled = permissionsLoaded && hasAccess && enabled

  const query = useQuery({
    queryKey,
    queryFn,
    ...options,
    enabled: isEnabled,
  })

  return {
    ...query,
    isPermissionLoading: isAuthLoading || !permissionsLoaded,
    isAccessDenied: permissionsLoaded && !hasAccess,
    userPermissions: user?.permissions,
  }
}

interface PermissionMutationConfig<TData, TVariables> {
  permissions: string[]
  mutationKey?: unknown[]
  mutationFn: (variables: TVariables) => Promise<TData>
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationKey' | 'mutationFn'>
}

export function usePermissionMutation<TData, TVariables>({
  permissions,
  mutationKey,
  mutationFn,
  options = {},
}: PermissionMutationConfig<TData, TVariables>) {
  const { user } = useAuthStore()

  const wrappedMutationFn = async (variables: TVariables): Promise<TData> => {
    const hasAccess = hasAnyPermission(user, permissions)
    if (!hasAccess) {
      throw new Error('Permission denied: You do not have permission to perform this action')
    }
    return mutationFn(variables)
  }

  return useMutation({
    mutationKey,
    mutationFn: wrappedMutationFn,
    ...options,
  })
}
