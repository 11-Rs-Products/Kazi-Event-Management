import { redirect } from 'next/navigation';

export default function HistoricalUsersRedirect() {
  redirect('/super-admin/archived-users');
}
