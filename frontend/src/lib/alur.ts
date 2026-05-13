export type StatusAlur = 'pre_submit' | 'waiting_payment' | 'payment_verified' | 'waiting_verification' | 'pra_asesmen' | 'asesmen_tahap2' | 'pleno' | 'finished';

export const FOCUSED_STATUSES: StatusAlur[] = ['pre_submit', 'waiting_payment', 'payment_verified'];

export const getRedirectPath = (status: StatusAlur): string => {
  switch (status) {
    case 'pre_submit':
      return '/auth/register';
    case 'waiting_payment':
      return '/pemohon/bayar';
    case 'payment_verified':
      return '/pemohon/borang';
    default:
      return '/pemohon/dashboard';
  }
};

export const isStatusAllowed = (currentStatus: StatusAlur, allowedStatuses: StatusAlur[]): boolean => {
  return allowedStatuses.includes(currentStatus);
};
