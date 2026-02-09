"use client";

import React, { useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { useDictionary } from "@/providers/dictionary-provider";

const PLAYBACK_ID = "p2c9MIWT2agNAAbgu4HQHgLgOFAAoHWH3d2ihPIIMjg";
const POSTER_URL = `https://image.mux.com/${PLAYBACK_ID}/animated.gif?width=320&end=3`;

interface OnboardingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingVideoModal({
  isOpen,
  onClose,
}: OnboardingVideoModalProps) {
  const { dict } = useDictionary();
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.showModal();
    } else if (!isOpen && modalRef.current) {
      modalRef.current.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClose = () => onClose();
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("close", handleClose);
      return () => modal.removeEventListener("close", handleClose);
    }
  }, [onClose]);

  const title =
    (dict.onboarding as any)?.video?.title ?? "Mira una introducción rápida";
  const description =
    (dict.onboarding as any)?.video?.description ??
    "Learn how to make your first prediction on Bofet.";

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box w-full max-w-2xl p-0 overflow-hidden relative">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">
            ✕
          </button>
        </form>

        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-base-content mb-2">{title}</h2>
          <p className="text-base-content/80 text-sm mb-4">{description}</p>
          <div
            className="w-full overflow-hidden rounded-xl onboarding-video-modal"
            style={{ aspectRatio: "16/9" }}
          >
            <style>{`
              .onboarding-video-modal mux-player::part(center-play-button) {
                display: none;
              }
            `}</style>
            <MuxPlayer
              playbackId={PLAYBACK_ID}
              poster={POSTER_URL}
              metadata={{ video_title: "Onboarding Video" }}
              style={{ aspectRatio: "16/9", width: "100%" }}
              streamType="on-demand"
              paused={!isOpen}
            />
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
