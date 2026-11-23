import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StepReview } from "@/components/wizard/StepReview";
import { emptyFssp, emptyPerson, type Service } from "@/lib/types";
import { emptyContract } from "@/lib/nbki-parser";

function Review({ basis = "art1" }: { basis?: Service["basis"] }) {
  const [person, setPerson] = useState({ ...emptyPerson(), previousPassport: "серия 4500 № 333444" });
  const [service, setService] = useState<Service>({ basis, unit: "", contractDate: "01.05.2026" });
  const [fssp, setFssp] = useState({ ...emptyFssp(), department: "Центральный РОСП" });
  const [contracts, setContracts] = useState([emptyContract()]);
  return <StepReview person={person} setPerson={setPerson} service={service} setService={setService} fssp={fssp} setFssp={setFssp} contracts={contracts} setContracts={setContracts} showClosed={false} onShowClosed={() => {}} onBack={() => {}} onNext={() => {}} />;
}

describe("Optional review blocks", () => {
  it("collapses previous passports when off and restores the edited value when re-enabled", () => {
    render(<Review />);
    fireEvent.click(screen.getByRole("switch", { name: "Прежние паспортные данные для архива ФССП" }));
    expect(screen.queryByLabelText("Прежние паспортные данные")).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Прежние паспортные данные для архива ФССП" }));
    expect(screen.getByLabelText("Прежние паспортные данные")).toHaveValue("серия 4500 № 333444");
  });
  it("collapses FSSP for holidays and preserves the department value", () => {
    render(<Review />);
    const toggle = screen.getByRole("switch", { name: "Документ для судебных приставов (ФССП)" });
    fireEvent.click(toggle);
    expect(screen.queryByLabelText("Наименование отдела ФССП (РОСП/ОСП)")).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Наименование отдела ФССП (РОСП/ОСП)")).toHaveValue("Центральный РОСП");
  });
  it("follows the service date by default but preserves an explicitly edited grace date", () => {
    render(<Review />);
    expect(screen.getByLabelText("Дата начала льготного периода")).toHaveValue("01.05.2026");
    fireEvent.change(screen.getByLabelText("Дата контракта / начала участия"), { target: { value: "02.05.2026" } });
    expect(screen.getByLabelText("Дата начала льготного периода")).toHaveValue("02.05.2026");
    fireEvent.change(screen.getByLabelText("Дата начала льготного периода"), { target: { value: "03.05.2026" } });
    fireEvent.change(screen.getByLabelText("Дата контракта / начала участия"), { target: { value: "04.05.2026" } });
    expect(screen.getByLabelText("Дата начала льготного периода")).toHaveValue("03.05.2026");
  });
  it("only shows vehicle fields for the secured variant", () => {
    const { unmount } = render(<Review />);
    expect(screen.queryByLabelText("Марка и модель автомобиля")).toBeNull();
    unmount(); render(<Review basis="art1_auto" />);
    expect(screen.getByLabelText("Марка и модель автомобиля")).toBeInTheDocument();
    expect(screen.getByLabelText("VIN-номер (или госномер)")).toBeInTheDocument();
  });
});