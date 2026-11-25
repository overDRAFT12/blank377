import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export const IOS_INSTALL_HINT = "На iPhone/iPad в Safari: Поделиться → На экран «Домой»";

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia?.("(display-mode: standalone)").matches ?? false);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice.catch(() => null);
      setPrompt(null);
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    toast(ios ? IOS_INSTALL_HINT : "Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран». На iPhone: Поделиться → На экран «Домой».");
  };

  return (
    <Button type="button" variant="outline" onClick={() => void install()} className="h-auto whitespace-normal px-4 py-2 text-left text-[13px] font-medium">
      <Download className="size-4 text-primary" /> Установить как приложение (для работы офлайн)
    </Button>
  );
}
