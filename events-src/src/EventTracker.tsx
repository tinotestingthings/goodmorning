import { useEffect, useMemo, useRef, useState } from "react";
import type { EventRecord, EventState, ScheduledAction, SourceRecord, View } from "./types";
import type { MonitoredFilm } from "./monitored-films";
import { filmSnapshotMeta } from "./film-snapshot";
import { loadState, setEventState, addManualEvent, setSourceOverride, addPreference, addRegion, removePreference, removeRegion, saveUnseenCount } from "./storage";
import { festivals, festivalEventId, festivalToEvent, festivalEvents, nextIsLive, inRegions, GENRES, SIZES, type Festival, type Genre } from "./festivals";

// Minimal stroke icons (Lucide-style paths) — replaces the old unicode glyphs.
const iconPaths: Record<string, React.ReactNode> = {
  discover: <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  festivals: <><path d="m12 4 9.5 17h-19L12 4z" /><path d="M12 12v9" /></>,
  saved: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
  actions: <><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5" /><path d="m9 11 3 3L22 4" /></>,
  timeline: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9.5h18" /></>,
  sources: <><circle cx="12" cy="12" r="2" /><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1" /></>,
  archive: <><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" /></>,
  settings: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M2 14h4M10 8h4M18 16h4" /></>,
  search: <><circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.5-4.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  more: <><circle cx="5" cy="12" r="0.8" /><circle cx="12" cy="12" r="0.8" /><circle cx="19" cy="12" r="0.8" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  restore: <><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  alert: <><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="10" /></>,
};
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const nav: { id: View; label: string; icon: string }[] = [
  { id: "discover", label: "Discover", icon: "discover" }, { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "festivals", label: "Festivals", icon: "festivals" },
  { id: "saved", label: "Saved", icon: "saved" }, { id: "actions", label: "Actions", icon: "actions" },
  { id: "timeline", label: "Timeline", icon: "timeline" }, { id: "sources", label: "Sources", icon: "sources" },
  { id: "archive", label: "Archive", icon: "archive" }, { id: "settings", label: "Settings", icon: "settings" },
];
const mobileTabs: View[] = ["discover", "inbox", "festivals", "saved", "timeline"];
const moreNav = nav.filter((item) => !mobileTabs.includes(item.id));

const filters = ["All", "This month", "Rare", "Free", "Nearby", "Tickets", "Film", "Nature", "Culture", "Music"];
const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const longMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const longWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dateParts = (value: string) => { const [year, month, day] = value.slice(0, 10).split("-").map(Number); return { year, month, day }; };
const formatDate = (value: string) => { const { year, month, day } = dateParts(value); return `${day} ${shortMonths[month - 1]} ${year}`; };
const dateFmt = { format: (value: Date) => `${value.getUTCDate()} ${shortMonths[value.getUTCMonth()]} ${value.getUTCFullYear()}` };
const eventDate = (event: EventRecord) => {
  if (!event.endAt) return formatDate(event.startAt);
  const start = dateParts(event.startAt); const end = dateParts(event.endAt);
  return start.year === end.year && start.month === end.month
    ? `${start.day}–${end.day} ${shortMonths[start.month - 1]} ${start.year}`
    : `${formatDate(event.startAt)}–${formatDate(event.endAt)}`;
};
const monthLabel = (value: string) => { const { year, month } = dateParts(value); return `${longMonths[month - 1]} ${year}`; };
const weekdayLabel = (value: string) => weekdays[new Date(`${value.slice(0, 10)}T12:00:00Z`).getUTCDay()];
const formatNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const startOfToday = () => { const today = new Date(); today.setHours(0, 0, 0, 0); return today; };
const filmSourceIds = new Set(["hartlooper", "springhaver", "slachtstraat", "kinepolis-utrecht", "nvpi-premieres"]);
const trackedStates: EventState[] = ["saved", "planned", "booked"];
const stateLabels: Partial<Record<EventState, string>> = { saved: "Saved", planned: "Planned", booked: "Booked" };

export function EventTracker({ initialEvents, sources: initialSources, scheduledActions, monitoredFilms }: { initialEvents: EventRecord[]; sources: SourceRecord[]; scheduledActions: ScheduledAction[]; monitoredFilms: MonitoredFilm[] }) {
  const [events, setEvents] = useState(initialEvents.filter((event) => event.dateStatus === "manual" || Boolean(event.dateVerifiedAt && event.sources.some((source) => source.url))));
  const [sources, setSources] = useState(initialSources);
  const [view, setView] = useState<View>("discover");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<EventRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; eventId?: string; previous?: EventState } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState<"preference" | "region" | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  // Append events that aren't in the list yet (by id), with your persisted
  // state/notes applied; existing records win.
  const mergeEvents = (fresh: EventRecord[]) => {
    if (!fresh.length) return;
    const states = loadState().eventStates;
    setEvents((items) => {
      const known = new Set(items.map((e) => e.id));
      return [...items, ...fresh.filter((e) => !known.has(e.id)).map((e) => states[e.id] ? { ...e, state: states[e.id].state, notes: states[e.id].notes } : e)];
    });
  };

  const showToast = (message: string, eventId?: string, previous?: EventState) => {
    setToast({ message, eventId, previous });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  };

  const updateState = (id: string, state: EventState) => {
    setEvents((items) => items.map((event) => event.id === id ? { ...event, state } : event));
    setDetail((current) => current?.id === id ? { ...current, state } : current);
    setEventState(id, { state });
  };

  const changeState = (id: string, state: EventState) => {
    const current = events.find((event) => event.id === id);
    if (!current) return;
    if (current.state === state) {
      showToast(`${current.title} is already ${stateLabels[state]?.toLowerCase() ?? state}`);
      return;
    }
    updateState(id, state);
    showToast(`${current.title} marked as ${stateLabels[state]?.toLowerCase() ?? state}`, id, current.state);
  };

  const saveNote = (id: string, notes: string) => {
    setEvents((items) => items.map((event) => event.id === id ? { ...event, notes } : event));
    setDetail((current) => current?.id === id ? { ...current, notes } : current);
    setEventState(id, { notes });
    showToast(notes.trim() ? "Personal note saved" : "Personal note removed");
  };

  const dismiss = (event: EventRecord) => {
    updateState(event.id, "dismissed");
    setDetail(null);
    showToast(`${event.title} dismissed`, event.id, event.state);
  };

  // Hydrate from persisted state (localStorage, synced to Supabase by boot.js)
  // instead of the old /api/user-state fetch. boot.js has already pulled the
  // remote row into localStorage before this app is mounted, so this is a
  // synchronous local read — no network round-trip needed here.
  useEffect(() => {
    const persisted = loadState();
    mergeEvents(persisted.manualEvents);
    // Festivals in the home regions (Utrecht + regions added in Settings), plus
    // any festival you already have a state for, land in the inbox as events;
    // other regions stay on the Festivals tab.
    mergeEvents(festivalEvents(["Utrecht", ...persisted.regions], persisted.eventStates, startOfToday()));
    if (Object.keys(persisted.eventStates).length) {
      setEvents((items) => items.map((event) => {
        const saved = persisted.eventStates[event.id];
        return saved ? { ...event, state: saved.state, notes: saved.notes } : event;
      }));
    }
    if (Object.keys(persisted.sourceOverrides).length) {
      setSources((items) => items.map((source) => {
        const enabled = persisted.sourceOverrides[source.id];
        if (enabled === undefined || enabled === source.enabled) return source;
        return { ...source, enabled, health: enabled ? (source.health === "Paused" ? "Healthy" : source.health) : "Paused" };
      }));
    }
    if (persisted.preferences.length) setPreferences(persisted.preferences);
    if (persisted.regions.length) setRegions(persisted.regions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    const today = startOfToday();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return events.filter((event) => {
      // Discover keeps running multi-day events visible until they end.
      if (view === "discover" && (event.state === "dismissed" || +new Date(event.endAt ?? event.startAt) < +today)) return false;
      if (view === "inbox" && event.state !== "unseen") return false;
      if (view === "saved" && !["saved", "planned", "booked"].includes(event.state)) return false;
      if (view === "archive" && !["dismissed", "attended", "seen"].includes(event.state)) return false;
      if (filter === "This month" && (+new Date(event.startAt) >= +monthEnd || +new Date(event.endAt ?? event.startAt) < +monthStart)) return false;
      if (filter === "Rare" && event.rarity < 80) return false;
      if (filter === "Free" && !event.isFree) return false;
      if (filter === "Nearby" && event.distanceKm > 10) return false;
      if (filter === "Tickets" && !event.tags.includes("ticketed")) return false;
      if (["Film", "Nature", "Culture", "Music"].includes(filter) && event.primaryCategory !== filter) return false;
      if (query && ![event.title, event.venueName, event.city, event.shortDescription, ...event.tags].join(" ").toLowerCase().includes(query)) return false;
      return true;
    }).sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  }, [events, filter, search, view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (view !== "inbox" || !filtered[0] || (event.target as HTMLElement).tagName === "INPUT") return;
      if (event.key.toLowerCase() === "s") updateState(filtered[0].id, "saved");
      if (event.key.toLowerCase() === "d") dismiss(filtered[0]);
      if (event.key === "Enter") setDetail(filtered[0]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // The handler intentionally follows the current top inbox card.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, view]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (mobileNavRef.current?.contains(target) || moreMenuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);

  const counts = useMemo(() => {
    const now = startOfToday();
    const weekAhead = new Date(+now + 7 * 86400000);
    return {
      inbox: events.filter((e) => e.state === "unseen").length,
      actions: events.filter((e) => trackedStates.includes(e.state) && (e.urgency >= 70 || e.milestones.length)).length + scheduledActions.length,
      changed: events.filter((e) => trackedStates.includes(e.state) && e.changes.length).length,
      deadlines: events.flatMap((e) => e.milestones).filter((m) => +new Date(m.occursAt) >= +now && +new Date(m.occursAt) < +weekAhead).length,
    };
  }, [events, scheduledActions]);

  // Keep the persisted unseen count in step, so goodmorning's home tile knows
  // whether there is anything to review without loading this app.
  useEffect(() => { saveUnseenCount(counts.inbox); }, [counts.inbox]);

  const addManual = (form: FormData) => {
    const title = String(form.get("title") || "Untitled event");
    const url = String(form.get("url"));
    const next: EventRecord = { ...initialEvents[0], id: `manual-${Date.now()}`, title, startAt: String(form.get("date")), endAt: undefined, city: String(form.get("city") || "Utrecht"), venueName: String(form.get("venue") || "Location to be confirmed"), shortDescription: String(form.get("notes") || "Manually added event awaiting enrichment."), state: "unseen", relevance: 65, rarity: 50, urgency: 45, preparation: 40, whyRelevant: "You added this event manually.", whyNow: "The date is user-entered and has not been independently verified.", recommendedAction: "Verify the date against the linked source", sources: [{ id: "manual", name: "Submitted source", firstSeenAt: "2026-08-12", url }], milestones: [], changes: [], tags: ["manual"], primaryCategory: "Other", accent: "blue", dateStatus: "manual", dateVerifiedAt: undefined };
    setEvents((items) => [next, ...items]);
    addManualEvent(next);
    setManualOpen(false); setView("inbox");
  };

  const addSetting = (form: FormData) => {
    const value = String(form.get("value") || "").trim();
    if (!value || !settingsModal) return;
    if (settingsModal === "preference") { setPreferences((items) => items.includes(value) ? items : [...items, value]); addPreference(value); }
    else { setRegions((items) => items.includes(value) ? items : [...items, value]); addRegion(value); mergeEvents(festivalEvents([value], {}, startOfToday())); }
    showToast(settingsModal === "preference" ? `${value} added as a preference` : `${value} added as a region`);
    setSettingsModal(null);
  };

  const toggleSave = (event: EventRecord) => changeState(event.id, event.state === "saved" ? "seen" : "saved");
  const saveFestival = (festival: Festival) => {
    const id = festivalEventId(festival);
    const existing = events.find((e) => e.id === id);
    if (existing) { toggleSave(existing); return; }
    const record = festivalToEvent(festival, startOfToday(), "saved");
    if (!record) return;
    // Persist first: mergeEvents reads the stored state, and the next load
    // derives this festival again because its id now has a state.
    setEventState(id, { state: "saved" });
    mergeEvents([record]);
    showToast(`${festival.name} saved`);
  };
  const dropRegion = (value: string) => {
    setRegions((items) => items.filter((item) => item !== value)); removeRegion(value); showToast(`${value} removed from regions`);
    // Take that region's festival events out again, except the ones you have a state for (those come back on load anyway).
    const gone = new Set(festivalEvents([value], {}, startOfToday()).map((e) => e.id));
    const states = loadState().eventStates;
    setEvents((items) => items.filter((e) => !gone.has(e.id) || e.id in states));
  };
  const dropPreference = (value: string) => { setPreferences((items) => items.filter((item) => item !== value)); removePreference(value); showToast(`${value} removed from preferences`); };

  const toggleSource = (id: string) => {
    setSources((items) => items.map((source) => {
      if (source.id !== id) return source;
      const enabled = !source.enabled;
      setSourceOverride(id, enabled);
      return { ...source, enabled, health: enabled ? "Healthy" : "Paused" };
    }));
  };

  const goTo = (next: View) => { setView(next); setFilter("All"); setMenuOpen(false); };
  const regionLabel = ["Utrecht", ...regions].join(" · ");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">Ev</span><div><strong>Eventino</strong><small>{regionLabel.toUpperCase()}</small></div></div>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map((item) => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => goTo(item.id)}><Icon name={item.icon} />{item.label}{item.id === "inbox" && counts.inbox > 0 && <b>{counts.inbox}</b>}</button>)}
        </nav>
        <div className="sidebar-foot"><button onClick={() => setManualOpen(true)}><Icon name="plus" size={15} /> Add event</button></div>
      </aside>

      <main>
        <header className="topbar">
          <label className="search-box"><Icon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events, venues, tags…" /></label>
          <button className="region-button" onClick={() => setView("settings")} aria-label="Open region settings">{regionLabel}</button>
        </header>

        <div className="page">
          {view === "discover" && <DiscoverHeader counts={counts} setView={setView} />}
          {view === "inbox" && <PageHeader title={`${counts.inbox} new ${counts.inbox === 1 ? "event" : "events"}`} description="Review what the sources found since your last visit." action={counts.inbox > 0 && <button className="secondary" onClick={() => events.filter(e => e.state === "unseen").forEach(e => updateState(e.id, "seen"))}>Mark all as seen</button>} />}
          {view === "festivals" && <PageHeader title="Festivals" description="Recurring festivals by region, size, genre and month — for when a weekend opens up." />}
          {view === "saved" && <PageHeader title="Saved" description="Track what needs attention — not just what happens next." />}
          {view === "actions" && <PageHeader title="Actions" description="Deadlines, preparation and ticket moments sorted by date." />}
          {view === "timeline" && <PageHeader title="Timeline" description="A calm chronological view of your upcoming events." />}
          {view === "sources" && <PageHeader title="Sources" description="What feeds the catalogue, and when it was last scanned." action={<button className="primary" onClick={() => setManualOpen(true)}>Import event</button>} />}
          {view === "archive" && <PageHeader title="Archive" description="Dismissed and past events stay available until you remove them." />}
          {view === "settings" && <PageHeader title="Settings" description="Regions, interests and film monitoring." />}

          {(["discover", "inbox", "saved", "archive"] as View[]).includes(view) && <>
            <div className="filter-row" role="toolbar" aria-label="Event filters">{filters.map((item) => <button className={filter === item ? "chip active" : "chip"} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
            {view === "inbox" && counts.inbox > 0 && <div className="shortcut-hint"><span>S</span> save <span>D</span> dismiss <span>↵</span> details</div>}
            <section className="event-grid" aria-live="polite">
              {filtered.map((event) => <EventCard key={event.id} event={event} onSave={() => toggleSave(event)} onDismiss={() => dismiss(event)} onOpen={() => setDetail(event)} onRestore={() => changeState(event.id, "seen")} />)}
              {!filtered.length && <EmptyState title="Nothing here right now" detail="Try another filter or search term. Your underlying event data is unchanged." />}
            </section>
            {view === "discover" && <Surprise events={events.filter((e) => e.rarity > 80 && e.relevance < 80 && e.state !== "dismissed" && +new Date(e.endAt ?? e.startAt) >= +startOfToday()).sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)).slice(0, 3)} onOpen={setDetail} />}
          </>}
          {view === "actions" && <Actions events={events} scheduledActions={scheduledActions} onOpen={setDetail} />}
          {view === "festivals" && <Festivals events={events} onSave={saveFestival} onOpen={setDetail} />}
          {view === "timeline" && <Timeline events={filtered} onOpen={setDetail} />}
          {view === "sources" && <Sources sources={sources} onToggle={toggleSource} />}
          {view === "settings" && <Settings sources={sources} onToggle={toggleSource} monitoredFilms={monitoredFilms} preferences={preferences} regions={regions} onAddPreference={() => setSettingsModal("preference")} onAddRegion={() => setSettingsModal("region")} onRemovePreference={dropPreference} onRemoveRegion={dropRegion} />}
        </div>
      </main>

      <nav ref={mobileNavRef} className="mobile-bottom-nav" aria-label="Mobile navigation">
        {nav.filter((item) => mobileTabs.includes(item.id)).map((item) => <button key={item.id} className={view === item.id && !menuOpen ? "nav-item active" : "nav-item"} onClick={() => goTo(item.id)}><Icon name={item.icon} size={20} /><em>{item.label}</em>{item.id === "inbox" && counts.inbox > 0 && <b>{counts.inbox}</b>}</button>)}
        <button className={!mobileTabs.includes(view) || menuOpen ? "nav-item active" : "nav-item"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name="more" size={20} /><em>More</em></button>
      </nav>
      {menuOpen && <div ref={moreMenuRef} className="more-menu">
        {moreNav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}><Icon name={item.icon} />{item.label}</button>)}
        <button onClick={() => { setManualOpen(true); setMenuOpen(false); }}><Icon name="plus" />Add event</button>
      </div>}

      {detail && <DetailPanel event={detail} onClose={() => setDetail(null)} onState={changeState} onSaveNote={saveNote} onDismiss={() => dismiss(detail)} />}
      {manualOpen && <ManualModal onClose={() => setManualOpen(false)} onAdd={addManual} />}
      {settingsModal && <SettingModal kind={settingsModal} onClose={() => setSettingsModal(null)} onAdd={addSetting} />}
      {toast && <div className="toast" role="status"><Icon name="check" size={16} /><p>{toast.message}</p>{toast.eventId && toast.previous && <button onClick={() => { updateState(toast.eventId!, toast.previous!); setToast(null); }}>Undo</button>}</div>}
    </div>
  );
}

function DiscoverHeader({ counts, setView }: { counts: Record<string, number>; setView: (view: View) => void }) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const scan = new Date(filmSnapshotMeta.scrapedAt);
  return <><div className="welcome-row"><div><p className="eyebrow">{`${longWeekdays[now.getDay()]} · ${now.getDate()} ${longMonths[now.getMonth()]}`.toUpperCase()}</p><h1>{greeting}, Martijn.</h1></div><p className="pulse">Film sources scanned {scan.getDate()} {shortMonths[scan.getMonth()]}</p></div>
    <div className="summary-strip"><button onClick={() => setView("inbox")}><strong>{counts.inbox}</strong><span>new events</span></button><button onClick={() => setView("actions")}><strong>{counts.actions}</strong><span>worth acting on</span></button><button onClick={() => setView("saved")}><strong>{counts.changed}</strong><span>saved events changed</span></button><button onClick={() => setView("actions")}><strong>{counts.deadlines}</strong><span>deadlines this week</span></button></div></>;
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function DateBlock({ event }: { event: EventRecord }) {
  const start = dateParts(event.startAt);
  const ongoing = event.endAt && +new Date(event.startAt) < +startOfToday() && +new Date(event.endAt) >= +startOfToday();
  if (ongoing) {
    const end = dateParts(event.endAt!);
    return <div className={`date-block ${event.accent}`}><b className="now">Now</b><span>until</span><small>{end.day} {shortMonths[end.month - 1]}</small></div>;
  }
  return <div className={`date-block ${event.accent}`}><b>{start.day}</b><span>{shortMonths[start.month - 1]}</span>{event.endAt && <small>→ {dateParts(event.endAt).day} {shortMonths[dateParts(event.endAt).month - 1]}</small>}</div>;
}

function EventCard({ event, onSave, onDismiss, onOpen, onRestore }: { event: EventRecord; onSave: () => void; onDismiss: () => void; onOpen: () => void; onRestore: () => void }) {
  return <article className="event-card">
    <button className="card-main" onClick={onOpen} aria-label={`Open ${event.title} details`}>
      <DateBlock event={event} />
      <div className="card-content">
        <div className="card-kicker"><i className={`dot ${event.accent}`} /><span>{event.primaryCategory}</span>{event.dateStatus !== "verified" && <em className="manual-flag">unverified date</em>}{stateLabels[event.state] && <b className="tracking-badge">{stateLabels[event.state]}</b>}</div>
        <h3>{event.title}</h3>
        <p className="meta">{eventDate(event)} · {event.venueName} · {event.city}</p>
        <p className="meta muted">{event.priceLabel}{event.distanceKm > 0 && ` · ${formatNumber(event.distanceKm)} km`}</p>
        <p className="why">{event.whyRelevant}</p>
      </div>
    </button>
    <div className="card-actions">
      {event.state === "dismissed"
        ? <button className="secondary" onClick={onRestore}><Icon name="restore" size={14} /> Restore</button>
        : <><SaveButton saved={event.state === "saved"} onClick={onSave} /><button className="ghost" onClick={onDismiss}>Dismiss</button></>}
      {event.sources[0]?.url && <a className="source-link" href={event.sources[0].url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{event.sources[0].name.split(" — ")[0]} ↗</a>}
    </div>
  </article>;
}

// Festivals tab. Filter options derive from the catalogue so they grow with it.
const regionOptions = [...new Set(festivals.flatMap((f) => [f.city, f.province]))];
const regionChoices = regionOptions.filter((r) => r !== "Utrecht"); // Utrecht is home, always on
const sizeOptions: [string, string][] = SIZES.map((s) => [s, s]);
const genreOptions: [string, string][] = Object.entries(GENRES).map(([key, g]) => [key, g.label]);
const monthOptions: [string, string][] = longMonths.map((m, i) => [String(i), m]);

// Next occurrence: the known next edition while it hasn't ended, else the 1st of
// the usual month — next year once that month is behind us. ponytail: the
// current month counts as "behind us" from the 15th; exact dates come from `next`.
const festivalAt = (festival: Festival, today: Date) => {
  if (nextIsLive(festival, today)) return new Date(`${festival.next!.start}T00:00:00`);
  const monthIndex = festival.month - 1;
  const behind = monthIndex < today.getMonth() || (monthIndex === today.getMonth() && today.getDate() >= 15);
  return new Date(today.getFullYear() + (behind ? 1 : 0), monthIndex, 1);
};

function SaveButton({ saved, disabled, onClick }: { saved: boolean; disabled?: boolean; onClick: () => void }) {
  return <button className={saved ? "secondary saved" : "secondary"} disabled={disabled} onClick={onClick}>{saved ? <><Icon name="check" size={14} /> Saved</> : <><Icon name="plus" size={14} /> {disabled ? "Date TBA" : "Save"}</>}</button>;
}

function Festivals({ events, onSave, onOpen }: { events: EventRecord[]; onSave: (festival: Festival) => void; onOpen: (event: EventRecord) => void }) {
  const [region, setRegion] = useState("All");
  const [size, setSize] = useState("All");
  const [genre, setGenre] = useState("All");
  const [month, setMonth] = useState("All");
  const list = useMemo(() => {
    const today = startOfToday();
    const byId = new Map(events.map((e) => [e.id, e] as const));
    return festivals
      .map((festival) => {
        // `listed` = the record in the main list (home region, or saved/dismissed before); `event` = what the card shows.
        const listed = byId.get(festivalEventId(festival)) ?? null;
        const event = listed ?? (nextIsLive(festival, today) ? festivalToEvent(festival, today) : null);
        return { festival, at: festivalAt(festival, today), listed, event };
      })
      .filter(({ festival, at }) => (region === "All" || inRegions(festival, [region])) && (size === "All" || festival.size === size) && (genre === "All" || festival.genres.includes(genre as Genre)) && (month === "All" || at.getMonth() === Number(month)))
      .sort((a, b) => +a.at - +b.at);
  }, [events, region, size, genre, month]);
  const select = (label: string, value: string, set: (next: string) => void, options: [string, string][]) =>
    <label className="festival-filter"><span>{label}</span><select className="chip" value={value} onChange={(e) => set(e.target.value)}><option value="All">All</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
  return <>
    <div className="filter-row festival-filters" role="toolbar" aria-label="Festival filters">
      {select("Region", region, setRegion, regionOptions.map((r) => [r, r]))}
      {select("Size", size, setSize, sizeOptions)}
      {select("Genre", genre, setGenre, genreOptions)}
      {select("Month", month, setMonth, monthOptions)}
    </div>
    <section className="event-grid" aria-live="polite">
      {list.map(({ festival, at, listed, event }) => <FestivalCard key={festival.id} festival={festival} at={at} event={event} onSave={() => onSave(festival)} onOpen={listed ? () => onOpen(listed) : undefined} />)}
      {!list.length && <EmptyState title="No festivals match" detail="Try another region, size, genre or month." />}
    </section>
  </>;
}

// `event` is only passed while the next edition is known and hasn't ended; the
// detail panel opens only for records in the main list (state buttons need that).
function FestivalCard({ festival, at, event, onSave, onOpen }: { festival: Festival; at: Date; event: EventRecord | null; onSave: () => void; onOpen?: () => void }) {
  const accent = GENRES[festival.genres[0]].accent;
  return <article className="event-card">
    <button className="card-main" onClick={onOpen} disabled={!onOpen} aria-label={`Open ${festival.name} details`}>
      {event ? <DateBlock event={event} /> : <div className={`date-block ${accent}`}><b>{shortMonths[at.getMonth()]}</b><span>{at.getFullYear()}</span></div>}
      <div className="card-content">
        <div className="card-kicker"><i className={`dot ${accent}`} /><span>{festival.genres.map((g) => GENRES[g].label).join(" · ")} · {festival.size}</span>{event && stateLabels[event.state] && <b className="tracking-badge">{stateLabels[event.state]}</b>}</div>
        <h3>{festival.name}</h3>
        <p className="meta">{event ? eventDate(event) : festival.when} · {festival.venue ?? festival.city}</p>
        <p className="meta muted">{festival.city === festival.province ? festival.city : `${festival.city} · ${festival.province}`}{festival.free ? " · Free" : ""}</p>
        <p className="why">{festival.blurb}</p>
      </div>
    </button>
    <div className="card-actions">
      <SaveButton saved={event?.state === "saved"} disabled={!event} onClick={onSave} />
      <a className="source-link" href={festival.url} target="_blank" rel="noreferrer">Official site ↗</a>
    </div>
  </article>;
}

function Actions({ events, scheduledActions, onOpen }: { events: EventRecord[]; scheduledActions: ScheduledAction[]; onOpen: (event: EventRecord) => void }) {
  const items = events.filter(e => ["saved", "planned", "booked"].includes(e.state)).flatMap(event => event.milestones.length ? event.milestones.map(m => ({ event, title: m.title, date: m.occursAt, urgency: event.urgency })) : [{ event, title: event.recommendedAction, date: event.startAt, urgency: event.urgency }]).sort((a,b) => +new Date(a.date)-+new Date(b.date));
  const combined = [
    ...items.map((item, i) => ({ kind: "event" as const, key: `${item.event.id}-${i}`, date: item.date, item })),
    ...scheduledActions.map((action) => ({ kind: "scheduled" as const, key: action.id, date: action.occursAt, action })),
  ].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  if (!combined.length) return <EmptyState title="No actions yet" detail="Save, plan or book an event to build your action queue." />;
  return <div className="action-list">{combined.map((entry) => entry.kind === "event" ? <button key={entry.key} onClick={() => onOpen(entry.item.event)}><span className={entry.item.urgency >= 80 ? "urgency urgent" : "urgency"}>{entry.item.urgency >= 80 ? "Act now" : "Upcoming"}</span><div><strong>{entry.item.title}</strong><p>{entry.item.event.title}</p></div><time>{formatDate(entry.date)}</time></button> : <div className="scheduled-action" key={entry.key}><span className="urgency scheduled">Scheduled</span><div><strong>{entry.action.title}</strong><p>{entry.action.detail} · {entry.action.recurrence}</p></div><time>{formatDate(entry.date)}</time></div>)}</div>;
}

function Timeline({ events, onOpen }: { events: EventRecord[]; onOpen: (event: EventRecord) => void }) {
  const today = startOfToday();
  const groups = Map.groupBy(events.filter(e => +new Date(e.endAt ?? e.startAt) >= +today), e => +new Date(e.startAt) < +today ? "Ongoing" : monthLabel(e.startAt));
  return <div className="timeline">{Array.from(groups).map(([month, items]) => <section key={month}><h2>{month}</h2>{items.map(event => <button key={event.id} onClick={() => onOpen(event)}><time><b>{dateParts(event.startAt).day}</b>{weekdayLabel(event.startAt)}</time><i className={`dot ${event.accent}`} /><div><strong>{event.title}</strong><p>{event.venueName} · {event.city}</p></div>{stateLabels[event.state] && <span className="tracking-badge">{stateLabels[event.state]}</span>}</button>)}</section>)}</div>;
}

function Sources({ sources, onToggle }: { sources: SourceRecord[]; onToggle: (id: string) => void }) {
  const scan = new Date(filmSnapshotMeta.scrapedAt);
  return <><div className="source-stats"><div><strong>{formatNumber(sources.reduce((n,s)=>n+s.events,0))}</strong><span>source records</span></div><div><strong>{sources.reduce((n,s)=>n+s.newEvents,0)}</strong><span>new this scan</span></div><div><strong>{sources.filter(s => s.enabled).length}/{sources.length}</strong><span>sources active</span></div><div><strong>{scan.getDate()} {shortMonths[scan.getMonth()]}</strong><span>last film scan</span></div></div>
    <div className="source-list">{sources.map(source => <div className="source-line" key={source.id}><div className="source-name"><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a><small>{source.type} · {source.scope} · scanned {source.lastScan}</small></div><span className="source-count"><b>{source.events}</b><small>{source.newEvents} new</small></span><span className={`health ${source.health.toLowerCase()}`}>{source.health}</span><button className={source.enabled ? "toggle on" : "toggle"} aria-label={`Toggle ${source.name}`} aria-pressed={source.enabled} onClick={() => onToggle(source.id)}><i /></button></div>)}</div></>;
}

function Settings({ sources, onToggle, monitoredFilms, preferences, regions, onAddPreference, onAddRegion, onRemovePreference, onRemoveRegion }: { sources: SourceRecord[]; onToggle: (id: string) => void; monitoredFilms: MonitoredFilm[]; preferences: string[]; regions: string[]; onAddPreference: () => void; onAddRegion: () => void; onRemovePreference: (value: string) => void; onRemoveRegion: (value: string) => void }) {
  const filmSources = sources.filter((source) => filmSourceIds.has(source.id));
  return <div className="settings-grid">
    <SettingsCard title="Regions" hint="Utrecht is home base. Festivals in your regions also land in the inbox; other regions stay on the Festivals tab.">
      <div className="region-line"><b>Utrecht</b><span>Home · 25 km radius</span></div>
      {regions.map((region) => <div className="region-line" key={region}><b>{region}</b><span>Monitored region</span><button className="remove" aria-label={`Remove ${region}`} onClick={() => onRemoveRegion(region)}><Icon name="close" size={14} /></button></div>)}
      <button className="secondary" onClick={onAddRegion}><Icon name="plus" size={14} /> Add region</button>
    </SettingsCard>
    <SettingsCard title="Discovery preferences" hint="Film monitoring is always on. Add other interests to make discovery more personal.">
      {preferences.length > 0 && <div className="pref-list">{preferences.map((item) => <span key={item} className="pref-chip">{item}<button aria-label={`Remove ${item}`} onClick={() => onRemovePreference(item)}><Icon name="close" size={12} /></button></span>)}</div>}
      <button className="secondary" onClick={onAddPreference}><Icon name="plus" size={14} /> Add preference</button>
    </SettingsCard>
    <section className="settings-card film-monitor">
      <div className="film-title"><div><h2>Film monitoring</h2><p>Premieres, rare screenings and short runs from Utrecht's film houses and the national release list.</p></div><span>{filmSources.filter((source) => source.enabled).length} of {filmSources.length} sources on</span></div>
      <div className="film-source-list">{filmSources.map((source) => <div key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><b>{source.name} ↗</b><small>{source.scope} · {source.health === "Warning" ? "scan incomplete" : `${source.events} records`}</small></a><button className={source.enabled ? "toggle on" : "toggle"} aria-label={`Toggle ${source.name}`} aria-pressed={source.enabled} onClick={() => onToggle(source.id)}><i /></button></div>)}</div>
      <div className="monitoring-rules">{monitoredFilms.map((film) => <div key={film.id}><span>Watching</span><b>{film.title}</b><small>{film.monitoringSignals.join(" · ")}</small></div>)}<div><span>Yearly review</span><b>Most anticipated films</b><small>Every 5 January · next run 5 Jan 2027</small></div></div>
    </section>
  </div>;
}

function SettingsCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) { return <section className="settings-card"><h2>{title}</h2>{hint && <p className="hint">{hint}</p>}{children}</section>; }

function Surprise({ events, onOpen }: { events: EventRecord[]; onOpen: (event: EventRecord) => void }) { if (!events.length) return null; return <section className="surprise"><div className="surprise-head"><h2>Outside your usual interests</h2><p>High-rarity finds to keep discovery surprising.</p></div>{events.map(event => <button key={event.id} onClick={() => onOpen(event)}><i className={`dot ${event.accent}`} /><div><b>{event.title}</b><small>{eventDate(event)} · {event.city}</small></div><Icon name="arrow" size={15} /></button>)}</section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty"><Icon name="discover" size={26} /><h3>{title}</h3><p>{detail}</p></div>; }

function DetailPanel({ event, onClose, onState, onSaveNote, onDismiss }: { event: EventRecord; onClose: () => void; onState: (id: string, state: EventState) => void; onSaveNote: (id: string, notes: string) => void; onDismiss: () => void }) {
  const [note, setNote] = useState(event.notes ?? "");
  useEffect(() => setNote(event.notes ?? ""), [event.id, event.notes]);
  return <div className="overlay"><aside className="detail-panel"><button className="close" onClick={onClose} aria-label="Close details"><Icon name="close" size={18} /></button>
    <div className={`detail-hero ${event.accent}`}><p>{event.primaryCategory}</p><h2>{event.title}</h2><span>{eventDate(event)} · {event.venueName} · {event.city}</span></div>
    <div className="detail-body">
      <p className={event.dateStatus === "verified" ? "date-trust verified" : "date-trust manual"}>{event.dateStatus === "verified" ? `Date verified against the official source on ${dateFmt.format(new Date(event.dateVerifiedAt!))}` : "User-entered date — not independently verified"}</p>
      <div className="detail-actions"><button className={event.state === "saved" ? "primary active" : "primary"} aria-pressed={event.state === "saved"} onClick={() => onState(event.id, "saved")}>{event.state === "saved" ? "✓ Saved" : "Save"}</button><button className={event.state === "planned" ? "secondary active" : "secondary"} aria-pressed={event.state === "planned"} onClick={() => onState(event.id, "planned")}>{event.state === "planned" ? "✓ Planned" : "Plan"}</button><button className={event.state === "booked" ? "secondary active" : "secondary"} aria-pressed={event.state === "booked"} onClick={() => onState(event.id, "booked")}>{event.state === "booked" ? "✓ Booked" : "Booked"}</button><button className="ghost" onClick={onDismiss}>Dismiss</button></div>
      <p className="lede">{event.shortDescription}</p>
      <section><h4>Why this matters</h4><div className="why-box"><p>{event.whyRelevant}</p>{event.whyNow && <p>{event.whyNow}</p>}<b>Next move — {event.recommendedAction}</b></div><div className="scores"><ScoreBox label="Rarity" value={event.rarity} /><ScoreBox label="Preparation" value={event.preparation} /><ScoreBox label="Urgency" value={event.urgency} /></div></section>
      <section><h4>Milestones</h4>{event.milestones.length ? <div className="milestones">{event.milestones.map(m => <div key={m.id}><i /><time>{dateFmt.format(new Date(m.occursAt))}</time><b>{m.title}</b></div>)}</div> : <p className="muted-text">No milestones added yet.</p>}</section>
      <section><h4>Seen on {event.sources.length} source{event.sources.length !== 1 ? "s" : ""}</h4>{event.sources.map(s => <div className="provenance" key={s.id}><div>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a> : <b>{s.name}</b>}<small>First seen {dateFmt.format(new Date(s.firstSeenAt))}</small></div></div>)}</section>
      <section><h4>Change history</h4>{event.changes.length ? event.changes.map(c => <div className="change" key={c.id}><div><b>{c.label}</b><p>{c.detail}</p></div><time>{dateFmt.format(new Date(c.detectedAt))}</time></div>) : <p className="muted-text">No meaningful changes detected.</p>}</section>
      <section><h4>Personal notes</h4><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context, plans or people to invite…" /><div className="note-actions"><button className="secondary" disabled={note === (event.notes ?? "")} onClick={() => onSaveNote(event.id, note)}>Save note</button></div></section>
    </div></aside></div>;
}
function ScoreBox({ label, value }: { label: string; value: number }) { return <div><strong>{value}</strong><span>{label}</span></div>; }

function ManualModal({ onClose, onAdd }: { onClose: () => void; onAdd: (form: FormData) => void }) { return <div className="overlay"><form className="modal" action={onAdd}><button type="button" className="close" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button><h2>Add an event</h2><p>Manual dates are clearly labelled until independently verified against their source.</p><label>Title<input name="title" required placeholder="Event title" /></label><label>Date and time<input name="date" required type="datetime-local" /></label><div className="form-row"><label>City<input name="city" defaultValue="Utrecht" /></label><label>Venue<input name="venue" placeholder="Optional" /></label></div><label>Official source URL<input name="url" required type="url" placeholder="https://" /></label><label>Notes<textarea name="notes" placeholder="What makes this worth tracking?" /></label><div className="modal-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary">Add to inbox</button></div></form></div>; }
function SettingModal({ kind, onClose, onAdd }: { kind: "preference" | "region"; onClose: () => void; onAdd: (form: FormData) => void }) { const preference = kind === "preference"; return <div className="overlay"><form className="modal" action={onAdd}><button type="button" className="close" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button><h2>Add {kind}</h2><p>{preference ? "Add a category, topic or event type you want to see more often." : "Pick a city or region the catalogue covers; its festivals then land in your inbox too."}</p><label>{preference ? "Preference" : "City or region"}{preference ? <input name="value" required autoFocus placeholder="For example: Architecture" /> : <select name="value" required autoFocus>{regionChoices.map((r) => <option key={r} value={r}>{r}</option>)}</select>}</label><div className="modal-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary">Add</button></div></form></div>; }
