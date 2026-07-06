import { useQuery } from '@tanstack/react-query';

import { api } from '../services/api';

export function useActivity() {
  return useQuery({ queryKey: ['activity'], queryFn: api.getActivity });
}
