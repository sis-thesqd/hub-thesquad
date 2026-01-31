import { revalidateTag } from "next/cache";

export const DEV_EMAIL = process.env.DEV_EMAIL || "jacob@churchmediasquad.com";

export const DIRECTORY_CACHE_TAG = "directory";

export const revalidateDirectory = () => revalidateTag(DIRECTORY_CACHE_TAG);
