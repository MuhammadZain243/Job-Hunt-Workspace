import { getAuth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = async () => {
  const auth = await getAuth();
  return toNextJsHandler(auth);
};

export async function GET(request: Request) {
  const { GET: get } = await handler();
  return get(request);
}

export async function POST(request: Request) {
  const { POST: post } = await handler();
  return post(request);
}
