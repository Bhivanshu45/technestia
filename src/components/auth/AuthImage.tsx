'use client';

import Image from "next/image";

const AuthImage = ({formType}: {formType: "signIn" | "signUp"}) => {
  return (
    <div className="w-full h-full overflow-hidden">
      <img
        src={
          formType === "signIn"
            ? "/signin-side-image.png"
            : "/signup-side-image.png"
        }
        alt="Auth Image"
        className="w-full h-full object-cover md:rounded-l-2xl rounded-t-2xl md:rounded-t-none"
      />
    </div>
  );
}

export default AuthImage
