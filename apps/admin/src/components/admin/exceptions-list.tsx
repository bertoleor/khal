"use client";

import { useTranslations } from "next-intl";
import type { CalendarException, ExceptionType } from "@khal/validations";
import { addException as addExceptionAction } from "@/lib/actions/exceptions";

function handleAddException(formData: FormData): void {
  void addExceptionAction(formData);
}

const TYPE_KEY: Record<ExceptionType, string> = {
  holiday: "exceptions.addType.holiday",
  vacation: "exceptions.addType.vacation",
  event: "exceptions.addType.event",
  block: "exceptions.addType.block",
};

export function ExceptionsList({
  exceptions,
}: {
  exceptions: CalendarException[];
}) {
  const t = useTranslations("Admin");

  return (
    <div className="mt-4 space-y-4">
      <form
        action={handleAddException}
        className="space-y-3 rounded-2xl border border-slate-200 p-4"
      >
        <input
          name="title"
          placeholder={t("exceptions.addTitle")}
          required
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        <div className="flex gap-2">
          <select
            name="type"
            defaultValue="holiday"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          >
            <option value="holiday">{t("exceptions.addType.holiday")}</option>
            <option value="vacation">{t("exceptions.addType.vacation")}</option>
            <option value="event">{t("exceptions.addType.event")}</option>
            <option value="block">{t("exceptions.addType.block")}</option>
          </select>
          <input
            name="date"
            type="date"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white"
        >
          {t("exceptions.addButton")}
        </button>
      </form>

      {exceptions.length === 0 ? (
        <p className="text-sm text-slate-500">{t("exceptions.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{exception.title}</p>
                <p className="text-sm text-slate-500">
                  {exception.date} · {t(TYPE_KEY[exception.type])}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
