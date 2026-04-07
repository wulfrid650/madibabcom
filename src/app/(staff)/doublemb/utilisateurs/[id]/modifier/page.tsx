import EditUserClient from './edit-user-client';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

export default function EditUserPage() {
  return <EditUserClient />;
}
