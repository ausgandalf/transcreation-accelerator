import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { TranslationState } from "../models/TranslationState";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const resourceId = url.searchParams.get("resourceId") || "";
  const field = url.searchParams.get("field") || "";
  const locale = url.searchParams.get("locale") || "";
  const market = url.searchParams.get("market") || "";

  if (!shop || !resourceId || !locale) {
    return json({ error: "Missing required parameters" }, { status: 400 });
  }

  console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXintentXXxXXXXX", intent);


  if (intent === "getByResourceId") {
    try {
      const rows = await TranslationState.getByResourceId({
        shop,
        resourceId,
        locale,
        market
      });
      return json(rows);
    } catch (error) {
      console.error(error);
      return json({ error: "Failed to fetch translation states" }, { status: 500 });
    }
  }

  if (intent === "get") {
    if (!field) {
      return json({ error: "Missing field parameter" }, { status: 400 });
    }
    
    try {
      const row = await TranslationState.get({
        shop,
        resourceId,
        field,
        locale,
        market
      });
      return json(row);
    } catch (error) {
      console.error(error);
      return json({ error: "Failed to fetch translation state" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const resourceId = formData.get("resourceId") as string;
  const field = formData.get("field") as string;
  const locale = formData.get("locale") as string;
  const market = formData.get("market") as string;
  const status = formData.get("status") as string;
  const previousValue = formData.get("previousValue") as string;

  if (!shop || !resourceId || !field || !locale) {
    return json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (intent === "upsert") {
    try {
      const row = await TranslationState.upsert({
        shop,
        resourceId,
        field,
        locale,
        market,
        status: status as any,
        previousValue,
      });
      return json(row);
    } catch (error) {
      console.error(error);
      return json({ error: "Failed to upsert translation state" }, { status: 500 });
    }
  }

  if (intent === "delete") {
    try {
      const success = await TranslationState.delete({
        shop,
        resourceId,
        field,
        locale,
        market
      });
      return json({ success });
    } catch (error) {
      console.error(error);
      return json({ error: "Failed to delete translation state" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
} 