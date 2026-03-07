import { router } from "./index";
import { eventsRouter } from "./routers/events";
import { guestsRouter } from "./routers/guests";
import { contactsRouter } from "./routers/contacts";
import { ticketTypesRouter } from "./routers/ticketTypes";
import { ordersRouter } from "./routers/orders";
import { settingsRouter } from "./routers/settings";
import { promotionsRouter } from "./routers/promotions";
import { scansRouter } from "./routers/scans";
import { campaignsRouter } from "./routers/campaigns";
import { formResponsesRouter } from "./routers/formResponses";
import { devicesRouter } from "./routers/devices";
import { ticketsRouter } from "./routers/tickets";
import { listsRouter } from "./routers/lists";
import { dataImportsRouter } from "./routers/dataImports";
import { reportsRouter } from "./routers/reports";
import { sentEmailsRouter } from "./routers/sentEmails";
import { eventExperienceRouter } from "./routers/eventExperience";

export const appRouter = router({
  events: eventsRouter,
  guests: guestsRouter,
  contacts: contactsRouter,
  ticketTypes: ticketTypesRouter,
  orders: ordersRouter,
  settings: settingsRouter,
  promotions: promotionsRouter,
  scans: scansRouter,
  campaigns: campaignsRouter,
  formResponses: formResponsesRouter,
  devices: devicesRouter,
  tickets: ticketsRouter,
  lists: listsRouter,
  dataImports: dataImportsRouter,
  reports: reportsRouter,
  sentEmails: sentEmailsRouter,
  eventExperience: eventExperienceRouter,
});

export type AppRouter = typeof appRouter;
