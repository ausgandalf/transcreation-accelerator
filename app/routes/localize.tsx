import {useState, useEffect, useCallback} from 'react';
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Outlet, useRouteError, useLoaderData, useNavigate, useNavigation, useActionData, useSubmit, useSearchParams } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Redirect, Fullscreen } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";

import {
  Page,
  Layout,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Icon,
  InlineStack,
  Text,
  Badge,
  Tooltip,
  FullscreenBar,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  QuestionCircleIcon,
} from '@shopify/polaris-icons';

import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import appStyles from "../res/style.css?url";

import { authenticate, login } from "../shopify.server";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: appStyles }
];

import { SelectPop } from 'app/components/SelectPop';
import { MarketsPop } from 'app/components/MarkertsPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect, getFullscreen } from 'app/components/Functions';
import { getShopLocales, getShopMarkets } from 'app/api/App';

import { sections } from 'app/api/data';

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);
  
  let locales = [];
  let markets = [];
  let endLoop = false;
  while (!endLoop) {
    try {
      locales = await getShopLocales(admin.graphql);
      endLoop = true;
    } catch (e) {}
  }

  endLoop = false;
  while (!endLoop) {
    try {
      markets = await getShopMarkets(admin.graphql);
      endLoop = true;
    } catch (e) {}
  }
  
  let defaultLocale = {locale: 'en', name: 'English', primary: true, published: true};
  let currentLocale = (locales.length > 0) ? locales[0] : defaultLocale;

  const url = new URL(request.url);
  if (url.searchParams.get("shopLocale")) {
    const localeCode = url.searchParams.get("shopLocale");
    locales.map((x, i) => {
      if (x.locale == localeCode) {
        currentLocale = x;
      }
      if (x.primary) {
        defaultLocale = x
      }
    });
  } else {
    throw redirect(`${url.pathname}?${url.searchParams.toString()}&shopLocale=${currentLocale.locale}`);
  }

  let currentMarket = {id:'', handle: '', name: '', locales: []};

  if (url.searchParams.get("market")) {
    const marketHandle = url.searchParams.get("market");
    markets.some((x) => {
      if (x.handle == marketHandle) {
        currentMarket = x;
        return true;
      }
    });
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    translation: polarisTranslations, 
    locales,
    markets,
    currentMarket,
    currentLocale,
    defaultLocale,
    init: true, 
    path: url.pathname, 
    shop: url.searchParams.get("shop")
  };
};

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };
  
  const defaultResponse:ActionDataType = {
    errors: {},
    ticket: false,
  };
  const errors = validateTicket(data);

  if (errors) {
    return Response.json({...defaultResponse, errors}, { status: 422 });
  }

  // TODO Ticket creation
  // const ticket = await db.tickets.create({ data });
  const ticket = {
    id: 1,
  };

  return Response.json({ ...defaultResponse, ticket });
}

export default function App() {
  
  const shopify = useAppBridge();

  const navigate = useNavigate();
  const submit = useSubmit();

  const { apiKey, locales, markets, currentMarket, currentLocale, defaultLocale, init, path, translation, shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "save";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  useEffect(() => {
    console.log('PATH:', path);
    // setIsLoading(nav.state === "loading");
  }, [nav.state, nav.formData])

  const onMarketUpdate = (market:string, locale: string) => {
    setIsLoading(true);
    let url = `${path}?shopLocale=${locale}`;
    if (market) url += `&market=${market}`;
    navigate(url);
    return;
  }

  let paths:Array<Object> = [];
  sections.map((x, i) => (
    x.items.map((y, i) => paths.push(y))
  ));
  
  const pathLabel = useCallback(() => {
    let label = '';
    paths.some((x) => {
      if (x.url == path) {
        label = x.content;
        return true;
      }
    })
    return label;
  }, [path]);

  const renderSections = () => {
 
    return (<SelectPop 
      label={pathLabel()}
      variant='headingMd'
      sections={sections.map(
        (x, i) => ({...x,
          items: x.items.map((y, j) => ({
            content: y.content,
            active: y.content == pathLabel(),
            onAction: () => {
              // Redirect
              if (y.content != pathLabel()) {
                setIsLoading(true);
                navigate(`${y.url}?shopLocale=${currentLocale.locale}`);

                // getRedirect(shopify).dispatch(
                //   Redirect.Action.APP,
                //   `${y.url}?shopLocale=${currentLocale.locale}`,
                // )
              }
            }
          })) 
        })
      )} />);
  }

  const renderMarkets = () => {
    return (<MarketsPop
      key={currentLocale.locale + '-' + currentMarket.handle}
      variant='headingMd'
      locales={locales}
      defaultLocale={defaultLocale}
      markets={markets}
      currentLocale={currentLocale}
      currentMarket={currentMarket}
      update={onMarketUpdate}
    />)
  }

  useEffect(() => {
    if (init) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 0);
    }
  }, [init]);

  let shopURL = `https://${shop}`;
  useEffect(() => {
    currentMarket.locales.some((x) => {
      if (x.locale == currentLocale.locale) {
        shopURL = x.url;
        return true;
      }
    })
    // console.log('localize route:', currentLocale, currentMarket);
    setIsLoading(false);
  }, [currentLocale, currentMarket]);



  return (
    <AppProvider i18n={translation} isEmbeddedApp apiKey={apiKey}>
      {isLoading && (<LoadingScreen />)}
      <Outlet context={{
        selectors: 
          <InlineStack gap='100' align='center'>
            {renderMarkets()}
            {renderSections()}
          </InlineStack>,
        locale: currentLocale,
        market: currentMarket,
        locales,
        shop: shopURL,
      }} />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
