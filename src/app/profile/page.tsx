import { requireAppUser } from "@/lib/auth/permissions";
import { ProfilePage } from "@/features/profile/components/ProfilePage";

export const metadata = {
  title: "My Profile",
};

export default async function ProfileRoute() {
  const appUser = await requireAppUser();

  return (
    <ProfilePage
      user={{
        id: appUser.id,
        fullName: appUser.fullName,
        email: appUser.email,
        phone: appUser.phone,
        role: appUser.role,
        createdAt: appUser.createdAt.toISOString(),
      }}
    />
  );
}
