import { useQuery } from '@tanstack/react-query';

import { api } from '../services/api';

export function useUpcoming() {
  return useQuery({ queryKey: ['upcoming'], queryFn: api.getUpcoming });
}
