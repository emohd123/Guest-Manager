import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Compatibility route for the retired admin-only login screen. */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const requestedRedirect = params.redirectTo;
  const redirectTo = Array.isArray(requestedRedirect) ? requestedRedirect[0] : requestedRedirect;
  const query = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : "";
  redirect(`/account/login${query}`);
}
