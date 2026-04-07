import UserProfileClient from './user-profile-client';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

export default function UserProfilePage() {
  return <UserProfileClient />;
}
