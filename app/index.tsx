import { Redirect } from 'expo-router';

export default function StartPage() {
  // Redirect to the app group. Its layout will handle auth and role-based redirection.
  return <Redirect href="/(app)/(pegawai)/home" />;
}