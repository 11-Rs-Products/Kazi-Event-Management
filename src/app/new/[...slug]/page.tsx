import { redirect } from 'next/navigation';

export default function Page({ params }: { params: { slug?: string[] } }) {
  const path = params?.slug ? params.slug.join('/') : 'dashboard';
  redirect(`/neob/${path}`);
}
