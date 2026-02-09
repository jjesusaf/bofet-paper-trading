"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useDictionary } from "@/providers/dictionary-provider";
import { useWallet } from "@/providers/WalletContext";
import OnboardingVideoModal from "@/components/OnboardingVideoModal";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const router = useRouter();
  const { dict, locale } = useDictionary();
  const { eoaAddress } = useWallet();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [showImage, setShowImage] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track viewport height
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  // Determine if image should be shown based on viewport height
  useEffect(() => {
    // Hide image if viewport height is less than 600px (small screens)
    // On mobile, hide if less than 500px
    const isSmallScreen = window.innerWidth < 768;
    const minHeight = isSmallScreen ? 500 : 600;
    setShowImage(viewportHeight >= minHeight);
  }, [viewportHeight]);

  // Map step numbers to image paths
  const stepImages = [
    "/assets/alt_img_0.png", // Step 1
    "/assets/alt_img_1.png", // Step 2
    "/assets/alt_img_2.png", // Step 3
  ];

  // Preload all images when modal opens
  useEffect(() => {
    if (isOpen) {
      // Preload all step images in the background
      stepImages.forEach((imagePath) => {
        const img = new window.Image();
        img.src = imagePath;
      });
    }
  }, [isOpen]);

  // Open/Close modal with DaisyUI
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.showModal();
      setCurrentStep(1);
    } else if (!isOpen && modalRef.current) {
      modalRef.current.close();
    }
  }, [isOpen]);

  // Handle modal close event
  useEffect(() => {
    const handleClose = () => {
      onClose();
    };

    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("close", handleClose);
      return () => modal.removeEventListener("close", handleClose);
    }
  }, [onClose]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const registerHref = `/${locale || "es"}/register`;
  const profileHref = `/${locale || "es"}/profile`;

  const handleGetStarted = () => {
    onClose();
    if (eoaAddress) {
      router.push(profileHref);
    }
  };

  const stepData = [
    {
      title: dict.howItWorksModal?.step1?.title ?? "1. Elige un Mercado Bofet",
      description: dict.howItWorksModal?.step1?.description ?? "Compra acciones 'Sí' o 'No' según tu capacidad intelectual. Comprar acciones es como apostarle al resultado. Los resultados cambian en tiempo real cuando otros traders ponen sus órdenes.",
    },
    {
      title: dict.howItWorksModal?.step2?.title ?? "2. Envía orden de compra",
      description: dict.howItWorksModal?.step2?.description ?? "Fondea tu cuenta con crédito/débito, transferencia bancaria o incluso crypto. Una vez sea fondeada tu cuenta estás listo para participar. No hay límites ni comisiones.",
    },
    {
      title: dict.howItWorksModal?.step3?.title ?? "3. Profit 🤑",
      description: dict.howItWorksModal?.step3?.description ?? "Vende tus acciones 'Sí' o 'No' en cualquier momento. O espera a que finalice un mercado para redimir tus ganancias a USD$1 por acción. Crea una cuenta y participa en minutos.",
    },
  ];

  const currentStepData = stepData[currentStep - 1];
  const isLastStep = currentStep === 3;

  return (
    <>
    <dialog ref={modalRef} className="modal">
      <div className="modal-box w-full max-w-full sm:max-w-md p-0 relative h-dvh sm:h-auto rounded-none sm:rounded-box">
        {/* Close button */}
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">
            ✕
          </button>
        </form>

        <div className="flex flex-col items-center text-center p-6 sm:p-8 h-dvh sm:h-auto justify-between">
          {/* Top content */}
          <div className="flex flex-col items-center text-center w-full">
            {/* Step indicator */}
            <div className="text-sm text-base-content/60 mb-3">
              {currentStep} de 3
            </div>

            {/* Image/illustration */}
            {showImage && (
              <div className="w-full rounded-lg mb-3 flex items-center justify-center">
                <Image
                  src={stepImages[currentStep - 1]}
                  alt={`Step ${currentStep} illustration`}
                  width={448}
                  height={192}
                  className="w-full h-auto object-contain rounded-lg"
                  priority
                />
              </div>
            )}

            {/* Step title */}
            <h2 className="text-2xl font-bold text-base-content mb-3">
              {currentStepData.title}
            </h2>

            {/* Step description */}
            <p className="text-base text-base-content/80 mb-4 leading-relaxed">
              {currentStepData.description}
            </p>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="text-primary hover:underline text-sm font-medium"
            >
              {dict.howItWorksModal?.watchOnboardingVideo ?? "Ver tutorial ahora"}
            </button>
          </div>

          {/* Navigation buttons */}
          <div className="w-full">
            {isLastStep ? (
              eoaAddress ? (
                <button
                  onClick={handleGetStarted}
                  className="btn btn-warning text-white border-none rounded-full w-full"
                >
                  {dict.howItWorksModal?.getStarted ?? "Comenzar"}
                </button>
              ) : (
                <Link
                  href={registerHref}
                  onClick={onClose}
                  className="btn btn-warning text-white border-none rounded-full w-full"
                >
                  {dict.howItWorksModal?.getStarted ?? "Comenzar"}
                </Link>
              )
            ) : (
              <button
                onClick={handleNext}
                className="btn bg-[#00C805] hover:bg-[#00A804] text-white border-none rounded-full w-full"
              >
                {dict.howItWorksModal?.next ?? "Siguiente"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    {/* Onboarding Video Modal - rendered via portal to avoid nested dialog issues */}
    {mounted &&
      createPortal(
        <OnboardingVideoModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
        />,
        document.body
      )}
    </>
  );
}
