import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function LoginPage() {
  async function signIn() {
    "use server";
    const store = await cookies();
    store.set("khal_role", "admin", { path: "/" });
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        Khal · Admin
      </h1>
      <form action={signIn} className="mt-6">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white"
        >
          Entrar como administradora
        </button>
      </form>
    </main>
  );
}
