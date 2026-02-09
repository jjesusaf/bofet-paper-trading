"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm, ValidationError } from "@formspree/react";
import Navbar from "@/components/Navbar";
import { useDictionary } from "@/providers/dictionary-provider";
import { useWallet } from "@/providers/WalletContext";

const FORMSPREE_FORM_ID = "xjgevbdq";
const JAM_CHROME_URL = "https://chromewebstore.google.com/detail/jam/iohjgamcilhbgmhbnllfolmkmmekfmci";

function ReportBugForm() {
  const { dict } = useDictionary();
  const [state, handleSubmit] = useForm(FORMSPREE_FORM_ID);
  const d = (dict as { reportBug?: typeof defaultReportBug }).reportBug ?? defaultReportBug;

  if (state.succeeded) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <p className="text-green-800 font-medium">{d.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-control w-full">
        <label htmlFor="email" className="label">
          <span className="label-text font-medium">{d.emailLabel}</span>
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder={d.emailPlaceholder}
          className="input input-bordered w-full"
          required
        />
        <ValidationError prefix="Email" field="email" errors={state.errors} />
      </div>

      <div className="form-control w-full">
        <label htmlFor="message" className="label">
          <span className="label-text font-medium">{d.messageLabel}</span>
        </label>
        <textarea
          id="message"
          name="message"
          placeholder={d.messagePlaceholder}
          className="textarea textarea-bordered w-full min-h-[120px]"
          required
        />
        <ValidationError prefix="Message" field="message" errors={state.errors} />
      </div>

      <div className="form-control w-full">
        <label htmlFor="jamUrl" className="label">
          <span className="label-text font-medium">{d.jamUrlLabel}</span>
        </label>
        <input
          id="jamUrl"
          type="url"
          name="jamUrl"
          placeholder={d.jamUrlPlaceholder}
          className="input input-bordered w-full"
        />
        <ValidationError prefix="JamUrl" field="jamUrl" errors={state.errors} />
      </div>

      <button
        type="submit"
        disabled={state.submitting}
        className="btn bg-[#00C805] hover:bg-[#00A804] text-white border-none w-full sm:w-auto"
      >
        {state.submitting ? d.submitting : d.submit}
      </button>
    </form>
  );
}

const defaultReportBug = {
  title: "Report a bug",
  intro:
    "I will contact the development team right away so they can review the error you reported in detail. To report the incident, please use our free provider JAM DEV and share the recording link with me through this form.",
  jamChrome: "JAM DEV is available on Chrome.",
  jamLink: JAM_CHROME_URL,
  thanks: "Thank you for your cooperation!",
  emailLabel: "Email address",
  emailPlaceholder: "you@example.com",
  messageLabel: "Describe the bug",
  messagePlaceholder: "What happened, what you expected, which page you were on...",
  jamUrlLabel: "Jam recording link",
  jamUrlPlaceholder: "https://jam.dev/c/...",
  submit: "Submit report",
  submitting: "Sending...",
  success:
    "Thank you. We have received your report and the Jam link. The team will review it shortly.",
};

export default function ReportBugPage() {
  const { dict } = useDictionary();
  const { eoaAddress } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname?.split("/")[1] || "es";

  useEffect(() => {
    if (eoaAddress === undefined) return; // still loading
    if (!eoaAddress) {
      router.replace(`/${locale}/signin`);
    }
  }, [eoaAddress, locale, router]);

  const d = (dict as { reportBug?: typeof defaultReportBug }).reportBug ?? defaultReportBug;

  if (eoaAddress === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#00C805]" />
      </div>
    );
  }

  if (!eoaAddress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">{d.title}</h1>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-8">
          <p className="text-slate-700 mb-4">{d.intro}</p>
          <p className="text-slate-700 mb-2">
            {d.jamChrome}{" "}
            <a
              href={d.jamLink}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary font-medium"
            >
              Chrome Web Store – Jam
            </a>
          </p>
          <p className="text-slate-700 font-medium">{d.thanks}</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <ReportBugForm />
        </div>
      </main>
    </div>
  );
}
