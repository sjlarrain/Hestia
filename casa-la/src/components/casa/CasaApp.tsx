"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import type { Application, BlockFormState, CasaData, CasaEmail, FormState, ModalKind, PartyGuest, Role } from "@/lib/types";
import {
  buildMonthCells,
  fmt,
  fmtRange,
  makeEmail,
  nights,
  rangeOpen,
  today,
  uid,
  validateApplication,
  validateBlock,
} from "@/lib/casa-logic";
import { loadLocal, saveLocal } from "@/lib/store";
import { COLORS } from "./tokens";
import Header from "./Header";
import BottomNav, { type NavTab } from "./BottomNav";
import Calendar from "./Calendar";
import SelectionBar from "./SelectionBar";
import GuestTrips from "./GuestTrips";
import HostOverview, { type ArrivalDeparture } from "./HostOverview";
import HostRequests from "./HostRequests";
import HostBlocks from "./HostBlocks";
import ApplyModal from "./ApplyModal";
import BlockModal from "./BlockModal";
import InboxModal from "./InboxModal";
import EmailModal from "./EmailModal";
import Toast from "./Toast";

type GuestTab = "calendar" | "trips";
type HostTab = "overview" | "requests" | "hcal" | "blocks";
type Tab = GuestTab | HostTab;

type ToastState = { text: string; color: string; email: CasaEmail | null };

function upsertApplication(list: Application[], app: Application): Application[] {
  const i = list.findIndex((a) => a.id === app.id);
  if (i >= 0) {
    const next = list.slice();
    next[i] = app;
    return next;
  }
  return [...list, app];
}

export default function CasaApp() {
  const params = useSearchParams();
  const hostName = params.get("host") || "Alex";
  const accent = params.get("accent") || "#B85C38";
  const startRole: Role = params.get("role") === "host" ? "host" : "guest";

  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<CasaData>({ applications: [], blocks: [], emails: [] });
  const [role, setRoleState] = useState<Role>("guest");
  const [tab, setTabState] = useState<Tab>("calendar");
  const now = new Date();
  const [monthY, setMonthY] = useState(now.getFullYear());
  const [monthM, setMonthM] = useState(now.getMonth());
  const [sel, setSel] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [modal, setModal] = useState<ModalKind>(null);
  const [hostAdd, setHostAdd] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [blockForm, setBlockForm] = useState<BlockFormState | null>(null);
  const [emailView, setEmailView] = useState<CasaEmail | null>(null);
  const [formErrorText, setFormErrorText] = useState("");
  const [blockErrorText, setBlockErrorText] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const fromInboxRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // One-time hydration from localStorage: `window` doesn't exist on the server,
    // so this can't be a lazy useState initializer — it has to run post-mount.
    const loadedData = loadLocal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loadedData);
    setRoleState(startRole);
    setTabState(startRole === "host" ? "overview" : "calendar");
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((patch: Partial<CasaData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveLocal(next);
      return next;
    });
  }, []);

  const flash = useCallback((text: string, color: string, email?: CasaEmail) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text, color, email: email || null });
    toastTimerRef.current = setTimeout(() => setToast(null), 4200);
  }, []);

  // ---------- navigation ----------
  const handleSetRole = (r: Role) => {
    setRoleState(r);
    setTabState(r === "host" ? "overview" : "calendar");
    setSel({ start: null, end: null });
    setModal(null);
  };
  const handleSetTab = (t: string) => {
    setTabState(t as Tab);
    setSel({ start: null, end: null });
  };
  const prevMonth = () => {
    let y = monthY;
    let m = monthM - 1;
    if (m < 0) {
      m = 11;
      y--;
    }
    setMonthY(y);
    setMonthM(m);
  };
  const nextMonth = () => {
    let y = monthY;
    let m = monthM + 1;
    if (m > 11) {
      m = 0;
      y++;
    }
    setMonthY(y);
    setMonthM(m);
  };

  // ---------- calendar interaction ----------
  const tapDay = (iso: string) => {
    const { start, end } = sel;
    if (!start || end) {
      setSel({ start: iso, end: null });
    } else if (iso < start) {
      setSel({ start: iso, end: null });
    } else if (iso === start) {
      setSel({ start: iso, end: null });
    } else {
      if (!rangeOpen(data, start, iso)) {
        flash("Those dates aren't all available", COLORS.declineInk);
        setSel({ start: iso, end: null });
        return;
      }
      setSel({ start, end: iso });
    }
  };
  const clearSel = () => setSel({ start: null, end: null });

  // ---------- apply form ----------
  const startRequest = () => {
    const arrival = sel.start || today();
    const departure = sel.end || sel.start || today();
    setHostAdd(role === "host");
    setFormErrorText("");
    setForm({ id: null, name: "", email: "", arrival, departure, people: 2, guests: [], status: "draft", mine: role === "guest" });
    setModal("apply");
  };
  const editApp = (id: string) => {
    const a = data.applications.find((x) => x.id === id);
    if (!a) return;
    setModal("apply");
    setHostAdd(false);
    setFormErrorText("");
    setForm(JSON.parse(JSON.stringify(a)));
  };
  const setFormPatch = (patch: Partial<FormState>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  const addGuest = () => setForm((prev) => (prev ? { ...prev, guests: [...prev.guests, { name: "", email: "" }] } : prev));
  const removeGuest = (i: number) =>
    setForm((prev) => (prev ? { ...prev, guests: prev.guests.filter((_, j) => j !== i) } : prev));
  const updateGuest = (i: number, field: keyof PartyGuest, val: string) =>
    setForm((prev) => (prev ? { ...prev, guests: prev.guests.map((g, j) => (j === i ? { ...g, [field]: val } : g)) } : prev));

  const closeModalAndForm = () => {
    setModal(null);
    setForm(null);
    setSel({ start: null, end: null });
  };

  const saveDraft = () => {
    if (!form) return;
    const err = validateApplication(data, form);
    if (err) {
      setFormErrorText(err);
      return;
    }
    const app: Application = { ...form, id: form.id || uid(), status: "draft", mine: true };
    persist({ applications: upsertApplication(data.applications, app) });
    closeModalAndForm();
    flash("Saved as draft", COLORS.muted);
  };

  const submitForm = () => {
    if (!form) return;
    const err = validateApplication(data, form);
    if (err) {
      setFormErrorText(err);
      return;
    }
    if (hostAdd) {
      const app: Application = { ...form, id: form.id || uid(), status: "approved", mine: false };
      persist({ applications: upsertApplication(data.applications, app) });
      closeModalAndForm();
      flash("Visit added to your calendar", COLORS.booked);
      return;
    }
    const app: Application = { ...form, id: form.id || uid(), status: "pending", mine: true };
    const list = upsertApplication(data.applications, app);
    const email = makeEmail("request", app, hostName);
    persist({ applications: list, emails: [email, ...data.emails] });
    closeModalAndForm();
    flash("Request sent to your host", COLORS.pendingDot, email);
  };

  // ---------- host actions ----------
  const approveApp = (id: string) => {
    const list = data.applications.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a));
    const app = list.find((a) => a.id === id)!;
    const email = makeEmail("approved", app, hostName);
    persist({ applications: list, emails: [email, ...data.emails] });
    flash(`${app.name} approved — email sent`, COLORS.booked, email);
  };
  const rejectApp = (id: string) => {
    const list = data.applications.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a));
    const app = list.find((a) => a.id === id)!;
    const email = makeEmail("rejected", app, hostName);
    persist({ applications: list, emails: [email, ...data.emails] });
    flash(`${app.name} declined — email sent`, COLORS.declineInk, email);
  };
  const cancelApp = (id: string) => {
    const list = data.applications.map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a));
    persist({ applications: list });
    flash("Request cancelled", COLORS.muted);
  };

  // ---------- blocks ----------
  const openBlockForm = () => {
    setModal("block");
    setBlockForm({ start: "", end: "", reason: "" });
    setBlockErrorText("");
  };
  const setBlockPatch = (patch: Partial<BlockFormState>) => setBlockForm((prev) => (prev ? { ...prev, ...patch } : prev));
  const saveBlock = () => {
    if (!blockForm) return;
    const err = validateBlock(blockForm);
    if (err) {
      setBlockErrorText(err);
      return;
    }
    const block = { id: uid(), start: blockForm.start, end: blockForm.end, reason: blockForm.reason.trim() || "Unavailable" };
    persist({ blocks: [...data.blocks, block] });
    setModal(null);
    setBlockForm(null);
    flash("Dates blocked", COLORS.muted);
  };
  const removeBlock = (id: string) => persist({ blocks: data.blocks.filter((b) => b.id !== id) });

  // ---------- email / toast ----------
  const toastTap = () => {
    if (toast?.email) {
      fromInboxRef.current = false;
      setEmailView(toast.email);
      setModal("email");
    }
    setToast(null);
  };
  const openInbox = () => setModal("inbox");
  const openEmailFromInbox = (e: CasaEmail) => {
    fromInboxRef.current = true;
    setEmailView(e);
    setModal("email");
  };
  const closeEmail = () => {
    setModal(data.emails.length && fromInboxRef.current ? "inbox" : null);
    setEmailView(null);
    fromInboxRef.current = false;
  };
  const closeModal = () => setModal(null);

  if (!loaded) return null;

  const isHost = role === "host";
  const todayStr = today();
  const pendingCount = data.applications.filter((a) => a.status === "pending").length;

  const calCells = buildMonthCells(data, monthY, monthM, sel);
  const monthLabel = new Date(monthY, monthM, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const hasSel = !!sel.start && !modal;
  const selRange = sel.start ? fmtRange(sel.start, sel.end || sel.start) : "";
  const selNights = sel.start ? (sel.end ? nights(sel.start, sel.end) : "Pick your departure") : "";

  const myTrips = data.applications.filter((a) => a.mine).sort((x, y) => x.arrival.localeCompare(y.arrival));

  const approvedApps = data.applications.filter((a) => a.status === "approved");
  const hereNow = approvedApps
    .filter((a) => todayStr >= a.arrival && todayStr <= a.departure)
    .reduce((s, a) => s + a.people, 0);
  const upcomingCount = approvedApps.filter((a) => a.departure >= todayStr).length;
  const arrivals: ArrivalDeparture[] = approvedApps
    .filter((a) => a.arrival >= todayStr)
    .sort((x, y) => x.arrival.localeCompare(y.arrival))
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      day: new Date(a.arrival + "T00:00:00").getDate(),
      mon: new Date(a.arrival + "T00:00:00").toLocaleDateString("en-US", { month: "short" }),
      name: a.name,
      meta: `${nights(a.arrival, a.departure)} · ${a.people} ${a.people === 1 ? "guest" : "guests"}`,
    }));
  const departures: ArrivalDeparture[] = approvedApps
    .filter((a) => a.departure >= todayStr)
    .sort((x, y) => x.departure.localeCompare(y.departure))
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      day: new Date(a.departure + "T00:00:00").getDate(),
      mon: new Date(a.departure + "T00:00:00").toLocaleDateString("en-US", { month: "short" }),
      name: a.name,
      meta: `Leaves ${fmt(a.departure)}`,
    }));

  const tabs: NavTab[] = isHost
    ? [
        { id: "overview", label: "Overview" },
        { id: "requests", label: "Requests" },
        { id: "hcal", label: "Calendar" },
        { id: "blocks", label: "Blocked" },
      ]
    : [
        { id: "calendar", label: "Calendar" },
        { id: "trips", label: "My trips" },
      ];

  const applyTitle = hostAdd ? "Add a visit" : form?.id ? "Edit request" : "Request your stay";
  const submitLabel = hostAdd ? "Add visit" : form?.id ? "Update & send" : "Send request";

  const outerStyle: CSSProperties & { "--accent"?: string } = {
    minHeight: "100dvh",
    background: COLORS.bgOuter,
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",
    fontFamily: "var(--font-hanken), sans-serif",
    "--accent": accent,
  };

  return (
    <div style={outerStyle}>
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          height: "100dvh",
          background: COLORS.bg,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 0 80px rgba(60,40,20,.18)",
        }}
      >
        <Header role={role} hasPendingForHost={pendingCount > 0} onSetRole={handleSetRole} onOpenInbox={openInbox} />

        <main className="cc-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px 20px 108px" }}>
          {!isHost && tab === "calendar" && (
            <div style={{ animation: "casaFade .3s ease" }}>
              <h1 style={{ fontFamily: "var(--font-instrument-serif), serif", fontWeight: 400, fontSize: 30, lineHeight: 1.1, margin: "2px 0 4px" }}>
                When would you like to stay?
              </h1>
              <p style={{ margin: "0 0 20px", color: "#7C7568", fontSize: 14, lineHeight: 1.5 }}>
                Pick your arrival and departure. Grey dates are unavailable.
              </p>
              <Calendar monthLabel={monthLabel} cells={calCells} accent={accent} onPrevMonth={prevMonth} onNextMonth={nextMonth} onDayClick={tapDay} />
            </div>
          )}

          {!isHost && tab === "trips" && (
            <GuestTrips trips={myTrips} accent={accent} onEdit={editApp} onCancel={cancelApp} onGoCalendar={() => handleSetTab("calendar")} />
          )}

          {isHost && tab === "overview" && (
            <HostOverview
              todayLabel={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              hostFirst={hostName.split(" ")[0]}
              hereNow={hereNow}
              pendingCount={pendingCount}
              upcomingCount={upcomingCount}
              arrivals={arrivals}
              departures={departures}
              onGoRequests={() => handleSetTab("requests")}
            />
          )}

          {isHost && tab === "requests" && <HostRequests requests={data.applications} onApprove={approveApp} onReject={rejectApp} />}

          {isHost && tab === "hcal" && (
            <div style={{ animation: "casaFade .3s ease" }}>
              <h1 style={{ fontFamily: "var(--font-instrument-serif), serif", fontWeight: 400, fontSize: 30, lineHeight: 1.1, margin: "2px 0 4px" }}>
                Calendar
              </h1>
              <p style={{ margin: "0 0 20px", color: "#7C7568", fontSize: 14, lineHeight: 1.5 }}>Tap free dates to add a visit yourself.</p>
              <Calendar monthLabel={monthLabel} cells={calCells} accent={accent} onPrevMonth={prevMonth} onNextMonth={nextMonth} onDayClick={tapDay} />
            </div>
          )}

          {isHost && tab === "blocks" && (
            <HostBlocks blocks={data.blocks} accent={accent} onAdd={openBlockForm} onRemove={removeBlock} />
          )}
        </main>

        {hasSel && (
          <SelectionBar
            selRange={selRange}
            selNights={selNights}
            ctaLabel={isHost ? "Add dates" : "Request"}
            accent={accent}
            onClear={clearSel}
            onStart={startRequest}
          />
        )}

        <BottomNav tabs={tabs} active={tab} accent={accent} onSelect={handleSetTab} />
      </div>

      {modal === "apply" && form && (
        <ApplyModal
          form={form}
          title={applyTitle}
          submitLabel={submitLabel}
          showDraftBtn={!hostAdd}
          errorText={formErrorText}
          accent={accent}
          onClose={closeModal}
          onChange={setFormPatch}
          onAddGuest={addGuest}
          onUpdateGuest={updateGuest}
          onRemoveGuest={removeGuest}
          onSaveDraft={saveDraft}
          onSubmit={submitForm}
        />
      )}

      {modal === "block" && blockForm && (
        <BlockModal form={blockForm} errorText={blockErrorText} accent={accent} onClose={closeModal} onChange={setBlockPatch} onSave={saveBlock} />
      )}

      {modal === "inbox" && <InboxModal emails={data.emails} onClose={closeModal} onOpenEmail={openEmailFromInbox} />}

      {modal === "email" && emailView && <EmailModal email={emailView} accent={accent} onClose={closeEmail} />}

      {toast && <Toast text={toast.text} color={toast.color} onTap={toastTap} />}
    </div>
  );
}
