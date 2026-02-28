import { redirect } from "next/navigation";

export default function CheckinRootRedirect() {
  // If someone accesses `/checkin` without an event ID, send them
  // to the events dashboard to choose an active event.
  redirect("/dashboard/events");
}
