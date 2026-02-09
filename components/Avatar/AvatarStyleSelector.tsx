"use client";

import { useState } from "react";
import UserAvatar from "./UserAvatar";
import useAvatarStyle from "@/hooks/useAvatarStyle";
import type { AvatarStyle } from "@/hooks/useAvatarStyle";
import { CheckCircle2 } from "lucide-react";

interface AvatarStyleSelectorProps {
  seed: string;
}

const AVATAR_STYLES: Array<{ value: AvatarStyle; label: string; description: string }> = [
  { value: "pixel-art", label: "Pixel Art", description: "Retro 8-bit" },
  { value: "notionists", label: "Notionists", description: "Minimalista y moderno" },
  { value: "avataaars", label: "Avataaars", description: "Diverso y personalizable" },
  { value: "fun-emoji", label: "Fun Emoji", description: "Caras expresivas" },
  { value: "lorelei", label: "Lorelei", description: "Realista ilustrado" },
  { value: "adventurer", label: "Adventurer", description: "Dibujado a mano" },
  { value: "bottts", label: "Bottts", description: "Robots" },
];

export default function AvatarStyleSelector({ seed }: AvatarStyleSelectorProps) {
  const { avatarStyle, setAvatarStyle } = useAvatarStyle();
  const [justSaved, setJustSaved] = useState(false);

  const handleStyleChange = (style: AvatarStyle) => {
    setAvatarStyle(style);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="text-center pb-4 shrink-0">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Elige tu estilo de avatar
        </h3>
        <p className="text-sm text-slate-500">
          Haz click en un estilo para seleccionarlo
        </p>

        {justSaved && (
          <div className="mt-2 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            ¡Guardado!
          </div>
        )}
      </div>

      {/* Preview fijo */}
      <div className="flex justify-center pb-4 shrink-0">
        <UserAvatar seed={seed} size={120} style={avatarStyle} />
      </div>

      {/* Grid con scroll */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => handleStyleChange(style.value)}
              className={`p-3 rounded-lg border-2 transition-all hover:border-[#00C805] ${
                avatarStyle === style.value
                  ? "border-[#00C805] bg-green-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <UserAvatar seed={seed} size={48} style={style.value} />
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-900">
                    {style.label}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {style.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer fijo */}
      <p className="text-xs text-slate-400 text-center pt-2 shrink-0">
        Powered by{" "}
        <a
          href="https://www.dicebear.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00C805] hover:underline"
        >
          DiceBear
        </a>
      </p>
    </div>
  );
}
