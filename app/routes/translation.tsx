import { AppProvider } from "@shopify/shopify-app-remix/react";
import { useLoaderData, Outlet } from "@remix-run/react";
import { useState } from "react";
import { Card, Text, TextField, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import appStyles from "../res/style.css?url";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: appStyles }
];


export const loader = async ({ request }) => {

  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;
  // const accessToken = session.accessToken; // Get token
  return JSON.stringify({ apiKey: process.env.SHOPIFY_API_KEY });
};

export default function TranslationsPage() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <Outlet />
    </AppProvider>
  );
}
