import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DonateDialog } from "@/components/site/DonateDialog";
import { Toaster } from "@/components/ui/sonner";
import { SBP_NOTICE, SUPPORT_TELEGRAM } from "@/lib/site";

describe("Donate dialog: СБП is not a live payment link yet", () => {
  it("shows the Telegram notice instead of sending the user to a payment page", async () => {
    render(
      <>
        <Toaster position="top-center" />
        <DonateDialog>
          <button>Поддержать проект</button>
        </DonateDialog>
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Поддержать проект" }));
    const sbp = await screen.findByRole("button", { name: /Поддержать через СБП/ });
    expect(sbp.tagName).toBe("BUTTON");

    fireEvent.click(sbp);

    expect(await screen.findByText(SBP_NOTICE, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(SBP_NOTICE).toContain(SUPPORT_TELEGRAM);
    // Nothing may leave the page as a payment redirect while the СБП gateway is unconfigured.
    expect(document.querySelectorAll('a[href^="http"]')).toHaveLength(0);
  });
});
