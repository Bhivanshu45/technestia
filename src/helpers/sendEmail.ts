import { resend } from "@/lib/resend";
import { ApiResponse } from "@/types/ApiResponse";
import { VerifyEmail } from "@/templates/VerifyEmail";
import { ResetPassword } from "@/templates/ResetPassword";
import { ResetPasswordPayload, VerifyEmailPayload } from "@/types/emailPayload";

export const sendEmail = async(
    payload: VerifyEmailPayload | ResetPasswordPayload
): Promise<ApiResponse>  => {
   try{
    const { type, username, email } = payload;
    // console.log("Sending verification email to:", email, "for user:", username, "with code:", verifyCode);

    let subject = "";
    let reactTemplate;

    if (type === "VERIFY") {
      subject = "Verify your Email";
      reactTemplate = VerifyEmail({ username, otp: payload.verifyCode });
    } else if (type === "RESET_PASSWORD") {
      subject = "Reset your Password";
      reactTemplate = ResetPassword({ username, resetLink: payload.resetLink });
    } else {
      throw new Error("Invalid email type");
    }

    const data = await resend.emails.send({
      from: "Technestia <noreply@bhivanshu.me>",
      to: email,
      subject: subject,
      react: reactTemplate
    });

    // console.log("Email Send Response:", data);

    const messageString = type === "VERIFY" ? "Verification email sent successfully." : "Reset Password email sent successfully.";
    return {
        success: true,
        message: messageString
    }

   }catch(error){
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email. Please try again later.",
    };
   }
}