import {useState, useEffect, useCallback} from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useOutletContext, useLoaderData, useNavigate, useNavigation, useFetcher, useActionData, useSubmit, useSearchParams } from "@remix-run/react";
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
  Pagination,
  Divider,
} from "@shopify/polaris";
import {
  FilterIcon
} from '@shopify/polaris-icons';

import polarisTranslations from "@shopify/polaris/locales/en.json";

import { authenticate, login } from "../../shopify.server";

import { SelectPop } from 'app/components/SelectPop';
import { MarketsPop } from 'app/components/MarkertsPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect, getFullscreen } from 'app/components/Functions';
import { getCollections } from 'app/api/App';
import { CheckListPop } from 'app/components/CheckListPop';

import { Skeleton } from './skeleton';
import { sections } from 'app/api/data';

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);

  return {
    init: true, 
    path: '/localize/collection',
  };
};

export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  if (data.action == 'list') {
    // Load Collection data
    let collections = false;
    let endLoop = false;
    while (!endLoop) {
      try {
        collections = await getCollections(admin.graphql, data.cursor);
        endLoop = true;
      } catch (e) {}
    }
    
    return Response.json({ collections, data, action: data.action });
  }
  
  // const defaultResponse:ActionDataType = {
  //   errors: {},
  //   ticket: false,
  // };
  // const errors = validateTicket(data);

  // if (errors) {
  //   return Response.json({...defaultResponse, errors}, { status: 422 });
  // }

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

  const { init, path } = useLoaderData<typeof loader>();
  // const actionData = useActionData<typeof action>();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // const [searchParams, setSearchParams] = useSearchParams();
  
  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "save";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  useEffect(() => {
    console.log(nav);
    // setIsLoading(nav.state === "loading");
  }, [nav])

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  const fetcher = useFetcher();
  
  const perPage = 12; // Let's keep this fixed for now
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(false);
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState(''); // if empty, means reached to the end.
  

  const pagedResources = resources.slice(page * perPage, (page + 1) * perPage);
  const totalPage = Math.ceil(resources.length / perPage);
  const isFirstLoad = typeof fetcher.data == 'undefined';
  const isLastPage = (cursor == '') && !(page < totalPage - 1);
  const shouldLoad = (cursor != '') && !(page < totalPage - 1);

  // useEffect(() => {
  //   console.log('cursor:', cursor, 'isLastPage:', isLastPage, resources.length);
  //   console.log(actionData);
  //   if (actionData) {
  //     if (actionData.collections.pageInfo.hasNextPage) {
  //       setCursor(actionData.collections.pageInfo.endCursor);
  //     }
  //     setResources((oldResources) => ([...oldResources, ...actionData.collections.nodes]));

  //     // Select first resource, if nothing selected.
  //     if (!selectedResource && (actionData.collections.nodes.length > 0)) setSelectedResource(actionData.collections.nodes[0]);
  //   }
  // }, [actionData]);

  useEffect(() => {
    // console.log('cursor:', cursor, 'isLastPage:', isLastPage, resources.length, fetcher);
    // console.log(fetcher.data);
    if (fetcher.data) {
      if (fetcher.data.collections.pageInfo.hasNextPage) {
        setCursor(fetcher.data.collections.pageInfo.endCursor);
      }
      setResources((oldResources) => ([...oldResources, ...fetcher.data.collections.nodes]));

      // Select first resource, if nothing selected.
      if (!selectedResource && (fetcher.data.collections.nodes.length > 0)) setSelectedResource(fetcher.data.collections.nodes[0]);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (init) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
    }
  }, [init]);

  function loadCollections(cursor:string = '') {
    if (!isFirstLoad && isLastPage) return;
    const data = {
      cursor,
      action: 'list',
    };
    fetcher.submit(data, { method: "post" });
    // submit(data, { method: "post" });
  }

  useEffect(() => {
    if (isFirstLoad || shouldLoad) loadCollections();
  }, [isFirstLoad, shouldLoad]);

  const filters = [
    {value: 'all', label: 'All'},
    {value: 'active', label: 'Active'},
    {value: 'draft', label: 'Draft'},
    {value: 'archived', label: 'Archived'},
  ]
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const context = useOutletContext();
  function returnHome() {
    setIsLoading(true);
    navigate(`/?shopLocale=${context.locale.locale}`);

    // getRedirect(shopify).dispatch(
    //   Redirect.Action.APP,
    //   `/?shopLocale=${context.locale.locale}`,
    // )
  }

  return (
    <Box>
      {!init || !isLoaded ? (
        <Skeleton />
      ) : (
        <Box minHeight='100%'>
          {isLoading && (<LoadingScreen />)}
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
                  {context.selectors}
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
          </Box>

          <div className='fullscreenLayout withTopBar'>
            <Layout>
              <Layout.Section variant='oneThird'>
                <div style={{background:'#fff',height:'100%',overflow:'auto'}}>
                  <BlockStack>
                    
                    <Box padding='200'>
                      <InlineStack align='space-between' blockAlign='center'>
                        <Text as='p'>Showing 13 of 50 Items</Text>
                        <CheckListPop 
                          label={<Button icon={FilterIcon} accessibilityLabel='Filter' />} 
                          multiple={false} 
                          options={filters} 
                          checked={filters.length > 0 ? [filters[0].value] : []}
                          onChange={(selected: string) => {
                            // TODO
                            // console.log(selected);
                          }} 
                        />
                      </InlineStack>
                    </Box>

                    <Divider/>

                    <div style={{height:'calc(100% - 120px',overflow:'auto'}}>

                      <div 
                        key={'collection-' + selectedResource.handle}
                        style={{
                          background: 'var(--p-color-bg-surface-brand-selected)',
                          padding: '10px 20px',
                        }}
                      >{selectedResource.title}</div>

                      { pagedResources.map((x, i) => (x.handle != selectedResource.handle) && (
                        <div 
                          key={'collection-' + x.handle}
                          style={{
                            padding: '10px 20px',
                          }}
                        >{x.title} Lalala</div>
                      ))}

                    </div>
                    
                    {((page > 0) || !isLastPage) && (
                      <Box padding='400'>
                        <BlockStack inlineAlign='center'>
                          <Pagination
                            hasPrevious = {page > 0}
                            onPrevious={() => {
                              setPage((prevPage) => Math.max(prevPage - 1, 0));
                            }}
                            hasNext = {!isLastPage}
                            onNext={() => {
                              setPage((prevPage) => Math.min(prevPage + 1, totalPage-1));
                            }}
                          />
                        </BlockStack>
                      </Box>
                    )}
                  </BlockStack>
                </div>
              </Layout.Section>
              
              <Layout.Section>

                <BlockStack gap='400'>
                  Content
                </BlockStack>

              </Layout.Section>  
            </Layout>
          </div>


        </Box>
      )}
    </Box>
  );
}
