import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
} from "@react-email/components";

interface EventCreatedEmailProps {
  username: string;
  eventTitle: string;
  eventUrl: string;
}

export default function EventCreatedEmail({
  username,
  eventTitle,
  eventUrl,
}: EventCreatedEmailProps) {
  const previewText = `Your event ${eventTitle} has been created!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Event Created Successfully! 🎉</Text>
          <Text style={paragraph}>
            Hey {username}, your event &quot;{eventTitle}&quot; has been created
            and is ready to be shared.
          </Text>
          <Text style={paragraph}>
            You can share your booking page with the link below:
          </Text>
          <Link href={eventUrl} style={button}>
            View Booking Page
          </Link>
          <Text style={footer}>
            Best regards,
            <br />
            mycalendar Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#3c4149",
};

const button = {
  backgroundColor: "#5850ec",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  marginTop: "25px",
};

const footer = {
  color: "#898989",
  fontSize: "14px",
  marginTop: "50px",
};
