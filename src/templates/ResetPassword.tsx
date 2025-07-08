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
  Button,
} from "@react-email/components";

interface ResetPasswordProps {
  username: string;
  resetLink: string;
}

export const ResetPassword = ({ username, resetLink }: ResetPasswordProps) => {
  return (
    <Html lang="en" dir="ltr" style={{ backgroundColor: "#f9fafb" }}>
      <Head>
        <title>Reset Your Password</title>
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

      <Preview>Reset your Technestia account password</Preview>

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
          <Heading as="h3">Reset your password</Heading>
        </Row>

        <Row>
          <Text>
            Hi {username}, <br />
            We received a request to reset your Technestia account password.
            Click the button below to proceed.
          </Text>
        </Row>

        <Row style={{ textAlign: "center", margin: "24px 0" }}>
          <Button
            href={resetLink}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Reset Password
          </Button>
        </Row>

        <Row>
          <Text style={{ textAlign: "center", margin: "16px 0" }}>
            (This link is valid for 15 minutes)
          </Text>
        </Row>

        <Row>
          <Text>
            If you’re unable to click the button, you can also copy and paste
            this link into your browser:
          </Text>
          <Text
            style={{
              wordBreak: "break-all",
              color: "#2563eb",
              marginTop: "8px",
            }}
          >
            {resetLink}
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
