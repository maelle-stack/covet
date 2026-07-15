import { useQuery } from '@tanstack/react-query';

import { api } from '../services/api';

export function useUserSettings() {
  return useQuery({ queryKey: ['user-settings'], queryFn: api.getUserSettings });
}
