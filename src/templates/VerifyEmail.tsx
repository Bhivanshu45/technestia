import {
  Html,
  Head,
  Preview,
  Section,
  Img,
  Heading,
  Text,
  Row,
  Font,
} from "@react-email/components";

interface VerifyEmailProps {
  username: string;
  otp: string;
}

export const VerifyEmail = ({ username, otp }: VerifyEmailProps) => {
  return (
    <Html lang="en" dir="ltr" style={{ backgroundColor: "#f9fafb" }}>
      <Head>
        <title>Email Verification</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>Use this code to verify your Technestia account: {otp}</Preview>

      <Section
        style={{
          backgroundColor: "#1f2937",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <Img
          src="https://res.cloudinary.com/doald6wv6/image/upload/v1751105981/android-chrome-192x192_qcrof0.png"
          alt="Technestia Logo"
          width="48"
          height="48"
          style={{ margin: "0 auto" }}
        />
        <Heading
          as="h2"
          style={{
            color: "white",
            marginTop: "10px",
            fontSize: "24px",
          }}
        >
          Technestia
        </Heading>
      </Section>

      <Section style={{ padding: "30px 20px" }}>
        <Row>
          <Heading as="h3">Verify your email address</Heading>
        </Row>

        <Row>
          <Text>
            Hi {username}, <br />
            Thanks for joining Technestia! Please verify your email address to
            continue.
          </Text>
        </Row>

        <Row>
          <Heading as="h4">Verification code</Heading>
        </Row>

        <Row>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              margin: "16px 0",
              color: "#2563eb",
              textAlign: "center",
              fontFamily: "Roboto, Arial, sans-serif",
            }}
          >
            {otp}
          </Text>
        </Row>

        <Row>
          <Text style={{ textAlign: "center" }}>
            (This code is valid for 30 minutes)
          </Text>
        </Row>

        <Row>
          <Text>
            If you did not request this, you can safely ignore this email.
          </Text>
        </Row>
      </Section>

      <Section
        style={{
          backgroundColor: "#f3f4f6",
          padding: "10px",
          textAlign: "center",
        }}
      >
        <Text style={{ fontSize: "12px", color: "#6b7280" }}>
          Technestia will never ask you to share your password, or personal
          details via email.
        </Text>
      </Section>
    </Html>
  );
};
