"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import getMagic from "@/lib/magic";
import config from "@/config";
import { useDictionary } from "@/providers/dictionary-provider";
import { useWallet } from "@/providers/WalletContext";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { dict } = useDictionary();
  const { syncWalletState } = useWallet();

  const isRegisterPath = pathname?.includes("/register") ?? false;
  const locale = pathname?.split("/")[1] || "es";

  const leftPanelVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const leftPanelItemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };

  const heading = isRegisterPath
    ? (dict.signin?.signUpTitle ?? "Create your account")
    : (dict.signin?.welcomeBack ?? "Welcome back");
  const subheading = isRegisterPath
    ? (dict.signin?.signUpSubtitle ?? "Sign up with your email to start trading on Bofet")
    : (dict.signin?.subtitle ?? "Sign in to your account to continue with Bofet");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError(dict.signin?.invalidEmail || "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const magic = getMagic();
      if (!magic) {
        throw new Error("Magic SDK not initialized");
      }

      await magic.auth.loginWithEmailOTP({ email });
      await syncWalletState();
      router.push("/");
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || dict.signin?.error || "An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-dvh" style={{ minWidth: "320px" }}>
      {/* Left panel - Branding (hidden on mobile) */}
      <div className="relative hidden flex-col items-start justify-between overflow-hidden bg-neutral-900 p-8 md:flex md:w-1/2 md:p-12">
        {/* Background image: globe + screens, cropped to cover panel */}
        <Image
          src="/assets/news_3.png"
          alt=""
          fill
          className="object-cover object-[42%_50%]"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <motion.div
          className="relative z-10 flex flex-col items-start justify-between flex-1 w-full"
          variants={leftPanelVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={leftPanelItemVariants}>
            <Link
              href="/"
              className="group inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded px-0 font-medium text-sm text-white/80 outline-none transition-colors hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              >
                <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
              </svg>
              {dict.signin?.back || "Back"}
            </Link>
          </motion.div>
          <motion.div className="relative z-10" variants={leftPanelItemVariants}>
            <h1 className="mb-2 max-w-sm font-medium text-4xl leading-[46px] text-white">
              {config.appName}
            </h1>
            <p className="max-w-sm text-white/90">
              {config.appDescription}
            </p>
          </motion.div>
          <motion.div className="relative z-10" variants={leftPanelItemVariants}>
            <Image
              src="/boget_logo_white.svg"
              alt={config.appName}
              width={120}
              height={40}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel - Form */}
      <div className="flex w-full flex-col overflow-auto bg-base-100 md:w-1/2">
        <div className="flex justify-center p-6 pt-8 md:p-8 md:pt-20">
          <Link href="/" className="flex items-center gap-3 md:hidden">
            <Image
              src="/bofet_logo.svg"
              alt={config.appName}
              width={120}
              height={40}
              priority
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 md:p-8 md:pt-0">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-1 px-6 text-left">
              <h1 className="text-2xl font-medium text-base-content">
                {heading}
              </h1>
              <p className="text-sm text-base-content/70">
                {subheading}
              </p>
            </div>

            <div className="relative px-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <label
                    htmlFor="email"
                    className="flex select-none items-center gap-1 text-sm font-medium leading-none text-base-content"
                  >
                    {dict.signin?.email || "Email"}
                    <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    placeholder={dict.signin?.emailPlaceholder || "Enter your email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="input input-bordered h-10 w-full rounded border-base-300 bg-base-100 px-3 py-1 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>

                {error && (
                  <div className="alert alert-error py-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-5 shrink-0 stroke-current"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary h-10 w-full rounded font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading loading-spinner loading-sm" />
                      {dict.signin?.loading || "Loading..."}
                    </span>
                  ) : (
                    dict.signin?.continue || "Continue"
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 flex flex-col flex-wrap items-center justify-center gap-4 px-8 text-center">
              <p className="text-[13px] text-base-content/60">
                {dict.signin?.termsPrefix || "By continuing, you agree to our"}{" "}
                <Link href={`/${locale}/terms-of-service`} className="link-hover link font-medium text-base-content/80">
                  {dict.signin?.termsOfService || "Terms of Service"}
                </Link>{" "}
                {dict.signin?.and || "and"}{" "}
                <Link href={`/${locale}/privacy-policy`} className="link-hover link font-medium text-base-content/80">
                  {dict.signin?.privacyPolicy || "Privacy Policy"}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center p-6 pb-8 text-center text-sm text-base-content/60">
          <p>
            Powered by{" "}
            <Link href="/" className="font-medium text-base-content hover:underline">
              {config.appName}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
