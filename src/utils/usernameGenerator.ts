import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

function filterUsernamePrefix(prefix: string) {
  return prefix
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_-]/g, "") // Remove invalid characters
    .slice(0, 15);
}

export default async function generateUsername(email: string) {
  const basicPrefix = email.split("@")[0];
  let emailPrefix = filterUsernamePrefix(basicPrefix);

    let generatedUsername = `${emailPrefix}_${nanoid(4)}`;
    let isUnique = false;

    while (!isUnique) {
      const existingUser = await prisma.user.findFirst({
        where: { username: generatedUsername },
      });

      if (!existingUser) {
        isUnique = true;
      } else {
        generatedUsername = `${emailPrefix}_${nanoid(4)}`;
      }
    }

    return generatedUsername;
}