import { createRoot } from "react-dom/client";
import { EventTracker } from "./EventTracker";
import { seedEvents, sources, scheduledActions } from "./data";
import { monitoredFilms } from "./monitored-films";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <EventTracker
      initialEvents={seedEvents}
      sources={sources}
      scheduledActions={scheduledActions}
      monitoredFilms={monitoredFilms}
    />
  );
}
