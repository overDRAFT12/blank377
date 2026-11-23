import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DonateDialog } from "@/components/site/DonateDialog";
import { Toaster } from "@/components/ui/sonner";
import { FORUM_URL, SBP_NOTICE } from "@/lib/site";

describe("Donate dialog: СБП is not a live payment link yet", () => {
  it("shows the forum notice instead of sending the user to a payment page", async () => {
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

    // The only external link is the forum thread, opened in a new tab with safe rel attributes.
    const links = [...document.querySelectorAll('a[href^="http"]')];
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe(FORUM_URL);
    expect(links[0]?.getAttribute("target")).toBe("_blank");
    expect(links[0]?.getAttribute("rel")).toContain("nofollow");

    fireEvent.click(sbp);

    expect(await screen.findByText(SBP_NOTICE, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(SBP_NOTICE).toContain(FORUM_URL);
  });
});
