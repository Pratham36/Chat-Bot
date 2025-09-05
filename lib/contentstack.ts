// lib/contentstack.ts
import axios from "axios";

export async function getEntries(contentType: string, locale = "en-us") {
  const base = process.env.NEXT_PUBLIC_CONTENTSTACK_BASE || "https://cdn.contentstack.io/v3";
  const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
  const token = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
  const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT || "production";

  if (!apiKey || !token) {
    throw new Error("Missing Contentstack API key or Delivery token");
  }

  const url = `${base}/content_types/${contentType}/entries`;

  console.log
  const res = await axios.get(url, {
    headers: {
      api_key: apiKey,
      access_token: token,
    },
    params: {
      environment,
      locale,
    },
  });

  console.log(res)
  return res.data.entries; // plain array of entries
}
