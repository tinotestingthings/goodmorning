import { useEffect, useMemo, useRef, useState } from "react";
import type { EventRecord, EventState, ScheduledAction, SourceRecord, View } from "./types";
import type { MonitoredFilm } from "./monitored-films";
import { loadState, setEventState, addManualEvent, setSourceOverride, addPreference, addRegion } from "./storage";

const nav: { id: View; label: string; icon: string }[] = [
  { id: "discover", label: "Discover", icon: "✦" }, { id: "inbox", label: "Inbox", icon: "↳" },
  { id: "saved", label: "Saved", icon: "⌑" }, { id: "actions", label: "Actions", icon: "✓" },
  { id: "timeline", label: "Timeline", icon: "┊" }, { id: "sources", label: "Sources", icon: "◎" },
  { id: "archive", label: "Archive", icon: "□" }, { id: "settings", label: "Settings", icon: "⚙" },
];

const filters = ["All", "This month", "Rare", "Free", "Nearby", "Tickets", "Film", "Nature", "Culture", "Music"];
const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const longMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
const moreNav = nav.filter((item) => !["discover", "inbox"].includes(item.id));
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
    if (persisted.manualEvents.length) {
      setEvents((items) => {
        const known = new Set(items.map((e) => e.id));
        const fresh = persisted.manualEvents.filter((e) => !known.has(e.id));
        return [...fresh, ...items];
      });
    }
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return events.filter((event) => {
      if (view === "discover" && (event.state === "dismissed" || +new Date(event.startAt) < +today)) return false;
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

  const counts = {
    inbox: events.filter((e) => e.state === "unseen").length,
    actions: events.filter((e) => trackedStates.includes(e.state) && (e.urgency >= 70 || e.milestones.length)).length + scheduledActions.length,
    changed: events.filter((e) => trackedStates.includes(e.state) && e.changes.length).length,
    deadlines: events.flatMap((e) => e.milestones).filter((m) => +new Date(m.occursAt) < +new Date("2026-08-20")).length,
  };

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
    else { setRegions((items) => items.includes(value) ? items : [...items, value]); addRegion(value); }
    showToast(settingsModal === "preference" ? `${value} added as a preference` : `${value} added as a region`);
    setSettingsModal(null);
  };

  const toggleSource = (id: string) => {
    setSources((items) => items.map((source) => {
      if (source.id !== id) return source;
      const enabled = !source.enabled;
      setSourceOverride(id, enabled);
      return { ...source, enabled, health: enabled ? "Healthy" : "Paused" };
    }));
  };

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand"><span className="brand-mark">EI</span><div><strong>Event Intelligence</strong><small>UTRECHT · NL</small></div></div>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map((item) => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => { setView(item.id); setFilter("All"); setMenuOpen(false); }}><span>{item.icon}</span>{item.label}{item.id === "inbox" && <b>{counts.inbox}</b>}</button>)}
        </nav>
        <div className="sidebar-foot"><button onClick={() => setManualOpen(true)}>＋ Add event</button><p><span className="live-dot" /> All systems operational</p></div>
      </aside>

      <main>
        <header className="topbar">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events, venues, tags…" /></label>
          <button className="region-button" onClick={() => setView("settings")} aria-label="Open region settings">Utrecht <span>⌄</span></button>
        </header>

        <div className="page">
          {view === "discover" && <DiscoverHeader counts={counts} setView={setView} />}
          {view === "inbox" && <PageHeader eyebrow="FRESH SIGNALS" title={`${counts.inbox} new events`} description="Review what the sources found since your last visit." action={<button className="secondary" onClick={() => events.filter(e => e.state === "unseen").forEach(e => updateState(e.id, "seen"))}>Mark all as seen</button>} />}
          {view === "saved" && <PageHeader eyebrow="YOUR TRACKER" title="Saved events" description="Track what needs attention—not just what happens next." />}
          {view === "actions" && <PageHeader eyebrow="ACTION QUEUE" title="Actions" description="Deadlines, preparation and ticket moments sorted by date." />}
          {view === "timeline" && <PageHeader eyebrow="UPCOMING" title="Timeline" description="A calm chronological view of your event horizon." />}
          {view === "sources" && <PageHeader eyebrow="INGESTION HEALTH" title="Sources" description="Monitor coverage, quality and which sources discover events earliest." action={<button className="primary" onClick={() => setManualOpen(true)}>＋ Import event</button>} />}
          {view === "archive" && <PageHeader eyebrow="RECOVERABLE HISTORY" title="Archive" description="Dismissed and past events stay available until you explicitly remove them." />}
          {view === "settings" && <PageHeader eyebrow="PREFERENCES" title="Settings" description="Shape discovery without closing the door on surprise." />}

          {(["discover", "inbox", "saved", "archive"] as View[]).includes(view) && <>
            <div className="filter-row" role="toolbar" aria-label="Event filters">{filters.map((item) => <button className={filter === item ? "chip active" : "chip"} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
            {view === "inbox" && <div className="shortcut-hint"><span>S</span> save <span>D</span> dismiss <span>↵</span> details</div>}
            <section className="event-grid" aria-live="polite">
              {filtered.map((event, index) => <EventCard key={event.id} event={event} featured={view === "discover" && index === 0} onSave={() => changeState(event.id, event.state === "saved" ? "seen" : "saved")} onDismiss={() => dismiss(event)} onOpen={() => setDetail(event)} onRestore={() => changeState(event.id, "seen")} />)}
              {!filtered.length && <EmptyState title="Nothing here right now" detail="Try another filter or search term. Your underlying event data is unchanged." />}
            </section>
            {view === "discover" && <Surprise events={events.filter((e) => e.rarity > 80 && e.relevance < 80).sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)).slice(0, 3)} onOpen={setDetail} />}
          </>}
          {view === "actions" && <Actions events={events} scheduledActions={scheduledActions} onOpen={setDetail} />}
          {view === "timeline" && <Timeline events={filtered} onOpen={setDetail} />}
          {view === "sources" && <Sources sources={sources} onToggle={toggleSource} />}
          {view === "settings" && <Settings sources={sources} onToggle={toggleSource} monitoredFilms={monitoredFilms} preferences={preferences} regions={regions} onAddPreference={() => setSettingsModal("preference")} onAddRegion={() => setSettingsModal("region")} />}
        </div>
      </main>

      <nav ref={mobileNavRef} className="mobile-bottom-nav" aria-label="Mobile navigation">
        {nav.filter((item) => ["discover", "inbox"].includes(item.id)).map((item) => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => { setView(item.id); setFilter("All"); setMenuOpen(false); }}><span>{item.icon}</span><em>{item.label}</em>{item.id === "inbox" && <b>{counts.inbox}</b>}</button>)}
        <button className={!["discover", "inbox"].includes(view) || menuOpen ? "nav-item active" : "nav-item"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span>•••</span><em>Other</em></button>
      </nav>
      {menuOpen && <div ref={moreMenuRef} className="more-menu">{moreNav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setFilter("All"); setMenuOpen(false); }}><span>{item.icon}</span>{item.label}</button>)}<button onClick={() => { setManualOpen(true); setMenuOpen(false); }}><span>＋</span>Add event</button></div>}

      {detail && <DetailPanel event={detail} onClose={() => setDetail(null)} onState={changeState} onSaveNote={saveNote} onDismiss={() => dismiss(detail)} />}
      {manualOpen && <ManualModal onClose={() => setManualOpen(false)} onAdd={addManual} />}
      {settingsModal && <SettingModal kind={settingsModal} onClose={() => setSettingsModal(null)} onAdd={addSetting} />}
      {toast && <div className="toast" role="status"><span>✓</span><p>{toast.message}</p>{toast.eventId && toast.previous && <button onClick={() => { updateState(toast.eventId!, toast.previous!); setToast(null); }}>Undo</button>}</div>}
    </div>
  );
}

function DiscoverHeader({ counts, setView }: { counts: Record<string, number>; setView: (view: View) => void }) {
  return <><div className="welcome-row"><div><p className="eyebrow">WEDNESDAY · 12 AUGUST</p><h1>Good morning, Martijn.</h1><p>Your event horizon has moved. Three things deserve attention today.</p></div><div className="pulse"><span className="live-dot" /> Last scan 12 min ago</div></div>
    <div className="summary-strip"><button onClick={() => setView("inbox")}><strong>{counts.inbox}</strong><span>new events</span><small>since Monday →</small></button><button onClick={() => setView("actions")}><strong>{counts.actions}</strong><span>worth acting on</span><small>priority queue →</small></button><button onClick={() => setView("saved")}><strong>{counts.changed}</strong><span>saved events changed</span><small>review updates →</small></button><button onClick={() => setView("actions")}><strong>{counts.deadlines}</strong><span>deadlines this week</span><small>see deadlines →</small></button></div>
    <div className="section-heading"><div><p className="eyebrow">UPCOMING EVENTS</p><h2>What’s next</h2></div><p>Events are shown chronologically. Intelligence scores remain behind the scenes.</p></div></>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function EventCard({ event, featured, onSave, onDismiss, onOpen, onRestore }: { event: EventRecord; featured?: boolean; onSave: () => void; onDismiss: () => void; onOpen: () => void; onRestore: () => void }) {
  return <article className={featured ? "event-card featured" : "event-card"}>
    <button className={`poster ${event.accent}`} onClick={onOpen} aria-label={`Open ${event.title} details`}><span>{event.primaryCategory}</span><b>{event.title.split(" ").slice(0, 2).join(" ")}</b><small>{event.city}</small></button>
    <div className="card-content"><div className="card-kicker"><span>{event.primaryCategory.toUpperCase()}</span>{stateLabels[event.state] && <b className="tracking-badge">{stateLabels[event.state]}</b>}</div><button className="title-button" onClick={onOpen}><h3>{event.title}</h3></button>
      <p className="meta">{eventDate(event)} · {event.venueName}</p><p className="meta">{event.city} · {formatNumber(event.distanceKm)} km · {event.priceLabel}</p>
      <p className={event.dateStatus === "verified" ? "date-trust verified" : "date-trust manual"}>{event.dateStatus === "verified" ? `✓ Date verified · ${formatDate(event.dateVerifiedAt!)}` : "! Date entered manually — check source"}</p>
      <div className="tags">{event.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="intelligence"><p><strong>Why this matters</strong>{event.whyRelevant}</p>{event.whyNow && <p className="why-now"><strong>Why now</strong>{event.whyNow}</p>}<p className="action-line"><strong>Next move</strong>{event.recommendedAction}</p></div>
      <div className="source-row"><span>{event.sources.length} source{event.sources.length !== 1 ? "s" : ""}</span><i />{event.sources.slice(0, 2).map((s) => s.url ? <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a> : <span key={s.id}>{s.name}</span>)}</div>
      <div className="card-actions">{event.state === "dismissed" ? <button className="primary" onClick={onRestore}>↶ Restore</button> : <><button className={event.state === "saved" ? "secondary saved" : "secondary"} onClick={onSave}>{event.state === "saved" ? "✓ Saved" : "＋ Save"}</button><button className="ghost" onClick={onDismiss}>Dismiss</button></>}<button className="detail-link" onClick={onOpen}>Details →</button></div>
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
  return <div className="action-list">{combined.map((entry) => entry.kind === "event" ? <button key={entry.key} onClick={() => onOpen(entry.item.event)}><span className={entry.item.urgency >= 80 ? "urgency urgent" : "urgency"}>{entry.item.urgency >= 80 ? "ACT NOW" : "UPCOMING"}</span><div><strong>{entry.item.title}</strong><p>{entry.item.event.title}</p></div><time>{formatDate(entry.date)}</time><b>→</b></button> : <div className="scheduled-action" key={entry.key}><span className="urgency scheduled">SCHEDULED</span><div><strong>{entry.action.title}</strong><p>{entry.action.detail} · {entry.action.recurrence}</p></div><time>{formatDate(entry.date)}</time><b>↻</b></div>)}</div>;
}

function Timeline({ events, onOpen }: { events: EventRecord[]; onOpen: (event: EventRecord) => void }) {
  const groups = Map.groupBy(events.filter(e => +new Date(e.startAt) > +new Date("2026-08-12")), e => monthLabel(e.startAt));
  return <div className="timeline">{Array.from(groups).map(([month, items]) => <section key={month}><h2>{month}</h2>{items.map(event => <button key={event.id} onClick={() => onOpen(event)}><time><b>{dateParts(event.startAt).day}</b>{weekdayLabel(event.startAt)}</time><i className={event.accent} /><div><strong>{event.title}</strong><p>{event.venueName} · {event.city}</p></div>{stateLabels[event.state] && <span className="saved-label">{stateLabels[event.state]!.toUpperCase()}</span>}<span className="timeline-arrow">→</span></button>)}</section>)}</div>;
}

function Sources({ sources, onToggle }: { sources: SourceRecord[]; onToggle: (id: string) => void }) {
  return <><div className="source-stats"><div><strong>{sources.reduce((n,s)=>n+s.events,0)}</strong><span>source records</span></div><div><strong>{sources.reduce((n,s)=>n+s.newEvents,0)}</strong><span>new this scan</span></div><div><strong>92%</strong><span>healthy coverage</span></div><div><strong>58 days</strong><span>avg. lead time</span></div></div>
    <div className="source-table"><div className="source-head"><span>Source</span><span>Coverage</span><span>Events</span><span>Save rate</span><span>Lead time</span><span>Earliest wins</span><span>Status</span></div>{sources.map(source => <div className="source-line" key={source.id}><span><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a><small>{source.type} · scanned {source.lastScan}</small></span><span>{source.scope}</span><span><b>{source.events}</b><small>{source.newEvents} new · {source.duplicates} dupes</small></span><span>{source.saveRate}%</span><span>{source.leadTime} days</span><span>{source.earliest}%</span><span><button className={source.enabled ? "toggle on" : "toggle"} aria-label={`Toggle ${source.name}`} onClick={() => onToggle(source.id)}><i /></button><small className={`health ${source.health.toLowerCase()}`}>{source.health}</small></span></div>)}</div></>;
}

function Settings({ sources, onToggle, monitoredFilms, preferences, regions, onAddPreference, onAddRegion }: { sources: SourceRecord[]; onToggle: (id: string) => void; monitoredFilms: MonitoredFilm[]; preferences: string[]; regions: string[]; onAddPreference: () => void; onAddRegion: () => void }) {
  const filmSources = sources.filter((source) => filmSourceIds.has(source.id));
  return <div className="settings-grid">
    <section className="settings-card film-monitor"><p className="eyebrow">FILM INTELLIGENCE</p><div className="film-title"><div><h2>Film monitoring</h2><p>Signals for popular premieres, rare screenings and short runs—without mixing unverified release dates into your feed.</p></div><span>{filmSources.filter((source) => source.enabled).length} SOURCES ON</span></div>
      <div className="film-scope"><div><b>Utrecht region</b><p>Film houses, specials, Q&amp;As, retrospectives and one-night screenings.</p></div><div><b>All Netherlands</b><p>National release dates and major premieres, including new blockbusters.</p></div></div>
      <div className="signal-chips"><span>Popular releases</span><span>Rare screenings</span><span>Temporary runs</span><span>Ticket sales</span><span>Release changes</span></div>
      <div className="film-source-list">{filmSources.map((source) => <div key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><b>{source.name} ↗</b><small>{source.scope} · {source.health === "Warning" ? "scan incomplete" : `${source.events} raw signals`}</small></a><button className={source.enabled ? "toggle on" : "toggle"} aria-label={`Toggle ${source.name}`} aria-pressed={source.enabled} onClick={() => onToggle(source.id)}><i /></button></div>)}</div>
      <div className="monitoring-rules">{monitoredFilms.map((film) => <div key={film.id}><span>WATCHING NOW</span><b>{film.title}</b><small>{film.monitoringSignals.join(" · ")}</small></div>)}<div><span>YEARLY REVIEW</span><b>Most anticipated films</b><small>Scheduled every 5 January · next run 5 Jan 2027</small></div></div>
      <div className="film-alerts"><Check label="Notify when tickets first go on sale" checked /><Check label="Notify for one-night and short-run screenings" checked /><Check label="Notify when a Dutch release date changes" checked /></div>
    </section>
    <SettingsCard title="Home location" eyebrow="LOCATION"><label>Home city<input defaultValue="Utrecht" /></label><label>Default radius<select defaultValue="25"><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option></select></label><p>52.0907° N, 5.1214° E · adjustable for distance calculations</p></SettingsCard>
    <SettingsCard title="Discovery preferences" eyebrow="OPTIONAL"><p>Film monitoring is active. Add other interests to make discovery more personal.</p>{preferences.length > 0 && <div className="signal-chips">{preferences.map((item) => <span key={item}>{item}</span>)}</div>}<button className="secondary" onClick={onAddPreference}>＋ Add preference</button></SettingsCard>
    <SettingsCard title="Notifications" eyebrow="SIGNALS"><Check label="Important event changes" /><Check label="Ticket sales & registration" /><Check label="Preparation deadlines" /><Check label="Upcoming event reminder" /></SettingsCard>
    <SettingsCard title="Regions" eyebrow="GEOGRAPHY"><div className="region-line"><b>Utrecht</b><span>City · 25 km</span><i>ACTIVE</i></div>{regions.map((region) => <div className="region-line" key={region}><b>{region}</b><span>Additional monitored region</span><i>ACTIVE</i></div>)}<button className="secondary" onClick={onAddRegion}>＋ Add region</button></SettingsCard>
  </div>;
}

function SettingsCard({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <section className="settings-card"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</section>; }
function Check({ label, checked }: { label: string; checked?: boolean }) { return <label className="check"><input type="checkbox" defaultChecked={checked} /><span>{label}</span></label>; }

function Surprise({ events, onOpen }: { events: EventRecord[]; onOpen: (event: EventRecord) => void }) { if (!events.length) return null; return <section className="surprise"><div><p className="eyebrow">EXPLORE · 15%</p><h2>Outside your usual interests</h2><p>High-rarity finds to keep discovery surprising.</p></div>{events.map(event => <button key={event.id} onClick={() => onOpen(event)}><span className={`mini-poster ${event.accent}`}>{event.primaryCategory[0]}</span><div><b>{event.title}</b><small>{event.city} · {event.rarity} rarity</small></div><span>→</span></button>)}</section>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty"><span>◎</span><h3>{title}</h3><p>{detail}</p></div>; }

function DetailPanel({ event, onClose, onState, onSaveNote, onDismiss }: { event: EventRecord; onClose: () => void; onState: (id: string, state: EventState) => void; onSaveNote: (id: string, notes: string) => void; onDismiss: () => void }) {
  const [note, setNote] = useState(event.notes ?? "");
  useEffect(() => setNote(event.notes ?? ""), [event.id, event.notes]);
  return <div className="overlay"><aside className="detail-panel"><button className="close" onClick={onClose} aria-label="Close details">×</button><div className={`detail-hero ${event.accent}`}><p>{event.primaryCategory}</p><h2>{event.title}</h2><span>{eventDate(event)} · {event.city}</span></div><div className="detail-body"><p className={event.dateStatus === "verified" ? "date-trust verified" : "date-trust manual"}>{event.dateStatus === "verified" ? `✓ Date verified against the official source on ${dateFmt.format(new Date(event.dateVerifiedAt!))}` : "! User-entered date — not independently verified"}</p><div className="detail-actions"><button className={event.state === "saved" ? "primary active" : "primary"} aria-pressed={event.state === "saved"} onClick={() => onState(event.id, "saved")}>{event.state === "saved" ? "✓ Saved" : "＋ Save"}</button><button className={event.state === "planned" ? "secondary active" : "secondary"} aria-pressed={event.state === "planned"} onClick={() => onState(event.id, "planned")}>{event.state === "planned" ? "✓ Planned" : "Plan"}</button><button className={event.state === "booked" ? "secondary active" : "secondary"} aria-pressed={event.state === "booked"} onClick={() => onState(event.id, "booked")}>{event.state === "booked" ? "✓ Booked" : "Booked"}</button><button className="ghost" onClick={onDismiss}>Dismiss</button></div><p className="lede">{event.shortDescription}</p><section><p className="eyebrow">EVENT INTELLIGENCE</p><div className="scores"><ScoreBox label="Rarity" value={event.rarity} /><ScoreBox label="Preparation" value={event.preparation} /><ScoreBox label="Urgency" value={event.urgency} /></div><div className="why-box"><strong>Why this matters</strong><p>{event.whyRelevant}</p>{event.whyNow && <><strong>Why now</strong><p>{event.whyNow}</p></>}<b>Next move · {event.recommendedAction}</b></div></section><section><p className="eyebrow">MILESTONES</p>{event.milestones.length ? <div className="milestones">{event.milestones.map(m => <div key={m.id}><i /><time>{dateFmt.format(new Date(m.occursAt))}</time><b>{m.title}</b></div>)}</div> : <p className="muted-text">No milestones added yet.</p>}</section><section><p className="eyebrow">SEEN ON {event.sources.length} SOURCES</p>{event.sources.map(s => <div className="provenance" key={s.id}><span className="source-icon">{s.name[0]}</span><div>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a> : <b>{s.name}</b>}<small>First seen {dateFmt.format(new Date(s.firstSeenAt))}</small></div></div>)}</section><section><p className="eyebrow">CHANGE HISTORY</p>{event.changes.length ? event.changes.map(c => <div className="change" key={c.id}><span>UPDATE</span><div><b>{c.label}</b><p>{c.detail}</p></div><time>{dateFmt.format(new Date(c.detectedAt))}</time></div>) : <p className="muted-text">No meaningful changes detected.</p>}</section><section><p className="eyebrow">PERSONAL NOTES</p><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context, plans or people to invite…" /><div className="note-actions"><button className="secondary" disabled={note === (event.notes ?? "")} onClick={() => onSaveNote(event.id, note)}>Save note</button></div></section></div></aside></div>;
}
function ScoreBox({ label, value }: { label: string; value: number }) { return <div><strong>{value}</strong><span>{label}</span></div>; }

function ManualModal({ onClose, onAdd }: { onClose: () => void; onAdd: (form: FormData) => void }) { return <div className="overlay"><form className="modal" action={onAdd}><button type="button" className="close" onClick={onClose}>×</button><p className="eyebrow">MANUAL PIPELINE</p><h2>Add an event</h2><p>Manual dates are clearly labelled until independently verified against their source.</p><label>Title<input name="title" required placeholder="Event title" /></label><label>Date and time<input name="date" required type="datetime-local" /></label><div className="form-row"><label>City<input name="city" defaultValue="Utrecht" /></label><label>Venue<input name="venue" placeholder="Optional" /></label></div><label>Official source URL<input name="url" required type="url" placeholder="https://" /></label><label>Notes<textarea name="notes" placeholder="What makes this worth tracking?" /></label><div className="modal-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary">Add to inbox</button></div></form></div>; }
function SettingModal({ kind, onClose, onAdd }: { kind: "preference" | "region"; onClose: () => void; onAdd: (form: FormData) => void }) { const preference = kind === "preference"; return <div className="overlay"><form className="modal" action={onAdd}><button type="button" className="close" onClick={onClose}>×</button><p className="eyebrow">{preference ? "DISCOVERY" : "GEOGRAPHY"}</p><h2>Add {kind}</h2><p>{preference ? "Add a category, topic or event type you want to see more often." : "Add another city or region to your monitored event horizon."}</p><label>{preference ? "Preference" : "City or region"}<input name="value" required autoFocus placeholder={preference ? "For example: Architecture" : "For example: Amsterdam"} /></label><div className="modal-actions"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary">Add</button></div></form></div>; }
