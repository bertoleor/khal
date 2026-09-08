import { getTranslations } from "next-intl/server";
import { ClientList, type ClientRow } from "@/components/admin/client-list";
import { appointmentsStore } from "@/lib/mocks/appointments";
import { clientsStore } from "@/lib/mocks/clients";

export default async function ClientesPage() {
  const t = await getTranslations("Admin.clients");
  const clients = clientsStore.list();
  const appointments = appointmentsStore.list();

  const ltvByClient = new Map<string, number>();
  for (const appointment of appointments) {
    if (appointment.status === "confirmado") {
      ltvByClient.set(
        appointment.clientName,
        (ltvByClient.get(appointment.clientName) ?? 0) + appointment.priceCents,
      );
    }
  }

  const rows: ClientRow[] = clients.map((client) => ({
    client,
    ltvCents: ltvByClient.get(client.name) ?? 0,
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {t("title")}
      </h1>
      <ClientList rows={rows} />
    </main>
  );
}
