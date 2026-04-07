import ManageUserRolesClient from './manage-user-roles-client';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

export default function UserRolesPage() {
  return <ManageUserRolesClient />;
}
