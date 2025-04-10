import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { syncProductTranslations } from "app/api/Actions";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop, admin } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop} in webhooks/app/others`);
  
  switch (topic) {
    case 'PRODUCTS_UPDATE':
      await syncProductTranslations(shop, admin, payload.id, true);
      break;
    case 'CUSTOMERS_DATA_REQUEST':
      break;
    case 'CUSTOMERS_REDACT':
      break;
    case 'SHOP_REDACT':
      break;
    default:
      throw new Response('Unhandled webhook topic', {status: 404});
  }
  
  return new Response();
};