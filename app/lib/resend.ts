import { Resend } from "resend";
import EventCreatedEmail from "../components/emails/EventCreated";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEventCreatedEmail({
  userEmail,
  username,
  eventTitle,
  eventUrl,
}: {
  userEmail: string;
  username: string;
  eventTitle: string;
  eventUrl: string;
}) {
  try {
    await resend.emails.send({
      from: "MyCalendar <notifications@mycalendar.com>",
      to: userEmail,
      subject: `Event Created: ${eventTitle}`,
      react: EventCreatedEmail({ username, eventTitle, eventUrl }),
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
