import {useState, useEffect, useCallback} from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation, useActionData, useSubmit, useSearchParams } from "@remix-run/react";
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

import { authenticate, login } from "../../shopify.server";

import { SelectPop } from 'app/components/SelectPop';
import { MarketsPop } from 'app/components/MarketsPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect, getFullscreen } from 'app/components/Functions';
import { getShopLocales, getShopMarkets } from 'app/api/GraphQL';

import { Skeleton } from './skeleton';
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
    throw redirect(`/localize/collection?${url.searchParams.toString()}&shopLocale=${currentLocale.locale}`);
  }

  let currentMarket = {handle: '', name: '', locales: []};

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
    locales,
    markets,
    currentMarket,
    currentLocale,
    defaultLocale,
    init: true, 
    path: '/localize/collection', 
    translation: polarisTranslations, 
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

  const submit = useSubmit();

  const { locales, markets, currentMarket, currentLocale, defaultLocale, init, path, translation, shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(currentMarket);
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  // const [searchParams, setSearchParams] = useSearchParams();
  
  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "save";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  useEffect(() => {
    setIsLoading(nav.state === "loading");
  }, [nav.state])

  const onMarketUpdate = (market:string, locale: string) => {
    setIsLoading(true);
    getRedirect(shopify).dispatch(
      Redirect.Action.APP,
      `/localize/collection?shopLocale=${locale}&market=${market}`,
    )
  }

  const renderSections = () => {
 
    return (<SelectPop 
      label='Collections'
      variant='bodyMd'
      sections={sections.map(
        (x, i) => ({...x,
          items: x.items.map((y, j) => ({
            content: y.content,
            active: y.content == 'Collections',
            onAction: () => {
              // Redirect
              if (y.content != 'Collections') {
                setIsLoading(true);
                getRedirect(shopify).dispatch(
                  Redirect.Action.APP,
                  `${y.url}?shopLocale=${selectedLocale.locale}`,
                )
              }
            }
          })) 
        })
      )} />);
  }

  const renderMarkets = () => {
    return (<MarketsPop
      variant='bodyMd'
      locales={locales}
      defaultLocale={defaultLocale}
      markets={markets}
      currentLocale={selectedLocale}
      currentMarket={selectedMarket}
      update={onMarketUpdate}
    />)
  }

  useEffect(() => {
    if (init) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
    }
  }, [init]);

  function returnHome() {
    setIsLoading(true);
    getRedirect(shopify).dispatch(
      Redirect.Action.APP,
      `/?shopLocale=${selectedLocale.locale}`,
    )
  }

  return (
    <Box>
      {!init || !isLoaded ? (
        <Skeleton />
      ) : (
        <Box>
          <FullscreenBar onAction={returnHome}>
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingLeft: '1rem',
                paddingRight: '1rem',
              }}
            >
              <div style={{marginLeft: '1rem', flexGrow: 1}}>
                <InlineStack gap='100'>
                  {renderMarkets()}
                  {renderSections()}
                </InlineStack>
              </div>
              <ButtonGroup>
                <Button onClick={() => {
                  getRedirect(shopify).dispatch(
                    Redirect.Action.REMOTE,
                    {
                      url: `https://${shop}`,
                      newContext: true,
                    }
                  )
                }}>View Store</Button>
                <Button 
                  variant="primary" 
                  onClick={() => {}}>
                  Save
                </Button>
              </ButtonGroup>
            </div>
          </FullscreenBar>

          <Page
            fullWidth
            title=''
            titleHidden
          >
            {isLoading && (<LoadingScreen />)}

            <Layout>
              <Layout.Section variant='oneThird'>
                <BlockStack gap='600'>
                  Menu
                </BlockStack>
              </Layout.Section>
              
              <Layout.Section>

                <BlockStack gap='400'>
                  Content
                </BlockStack>

              </Layout.Section>  
            </Layout>

          </Page>
        </Box>
      )}
    </Box>
  );
}
