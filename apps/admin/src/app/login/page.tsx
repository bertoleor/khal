import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const t = await getTranslations("Admin.login");

  async function signIn() {
    "use server";
    const store = await cookies();
    store.set("khal_role", "admin", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        {t("title")}
      </h1>
      <form action={signIn} className="mt-6">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white"
        >
          {t("button")}
        </button>
      </form>
    </main>
  );
}
