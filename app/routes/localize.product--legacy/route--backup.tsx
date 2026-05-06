import {useState, useEffect, useMemo, useCallback} from 'react';
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
  Thumbnail,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import polarisTranslations from "@shopify/polaris/locales/en.json";

import { authenticate, login } from "../../shopify.server";

import { SelectPop } from 'app/components/SelectPop';
import { MarketsPop } from 'app/components/MarkertsPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect, getFullscreen } from 'app/components/Functions';
import { getProducts } from 'app/api/App';
import { CheckListPop } from 'app/components/CheckListPop';

import { Skeleton, SkeletonResources } from './skeleton';
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
    let productsData = {};
    let endLoop = false;
    while (!endLoop) {
      try {
        productsData = await getProducts(admin.graphql, data.cursor, data.status, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
    
    return Response.json({ ...productsData, input:data });
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
  const [isResourceLoading, setIsResourceLoading] = useState(false);
  

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
  
  const perPage = 10; // Let's keep this fixed for now
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(false);
  const [pagedResources, setPagedResources] = useState([]);
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState(''); // if empty, means reached to the end.
  const [knownTotalPage, setKnownTotalPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');

  const totalPage = Math.ceil(resources.length / perPage);
  const isFirstLoad = typeof fetcher.data == 'undefined';
  const isLastPage = (cursor == '') && !(page < totalPage - 1);
  const shouldLoad = (cursor != '') && !(page < totalPage);
  const hasPagination = (page > 0) || !isLastPage;
  // const pagedResources = resources.slice(page * perPage, (page + 1) * perPage);
  // const isSelectedResourceIn = pagedResources.some((x) => (x.handle == selectedResource?.handle));
  // const displayingResources = isSelectedResourceIn ? [...pagedResources] : [selectedResource, ...pagedResources];

  // useEffect(() => {
  //   console.log('cursor:', cursor, 'isLastPage:', isLastPage, resources.length);
  //   console.log(actionData);
  //   if (actionData) {
  //     if (actionData.products.pageInfo.hasNextPage) {
  //       setCursor(actionData.products.pageInfo.endCursor);
  //     }
  //     setResources((oldResources) => ([...oldResources, ...actionData.products.nodes]));

  //     // Select first resource, if nothing selected.
  //     if (!selectedResource && (actionData.products.nodes.length > 0)) setSelectedResource(actionData.products.nodes[0]);
  //   }
  // }, [actionData]);

  useEffect(() => {
    setIsResourceLoading(false);
    console.log(fetcher);
    if (fetcher.data) {
      setKnownTotalPage(fetcher.data.total);
      if (fetcher.data.products.pageInfo.hasNextPage) {
        setCursor(fetcher.data.products.pageInfo.endCursor);
      } else {
        setCursor(''); // Disable loading
      }
      const newResources = [...resources, ...fetcher.data.products.nodes];
      setResources(newResources);

      // Select first resource, if nothing selected.
      if (!selectedResource && (fetcher.data.products.nodes.length > 0)) setSelectedResource(fetcher.data.products.nodes[0]);
    } else {
      setCursor(''); // Disable loading
    }
  }, [fetcher.data]);

  useEffect(() => {
    let showingResources = resources.slice(page * perPage, (page + 1) * perPage);
    if (selectedResource) {
      const isIncluded = showingResources.some((x) => (x.handle == selectedResource?.handle));
      if (!isIncluded) {
        showingResources = [selectedResource, ...showingResources];
      }
    }
    setPagedResources(showingResources);
  }, [resources, page]);

  useEffect(() => {
    if (init) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
    }
  }, [init]);

  const loadProducts = (props:{}) => {
    // if (!isFirstLoad && isLastPage) return;
    setIsResourceLoading(true);
    const data = {
      cursor: props.cursor,
      perPage: props.perPage,
      status: props.status,
      action: 'list',
    };
    console.log('submitting...');
    fetcher.submit(data, { method: "post" });
    // submit(data, { method: "post" });
  };

  const loadProductsByState = () => {
    loadProducts({cursor, perPage, status: filterStatus});
  };

  useEffect(() => {
    console.log('Is first load?', isFirstLoad, 'Should load?', shouldLoad, 'Is last page?', isLastPage, cursor, page);
    if (isFirstLoad || shouldLoad) loadProductsByState();
  }, [resources, page]);

  const filters = [
    {value: '', label: 'All'},
    {value: 'ACTIVE', label: 'Active'},
    {value: 'DRAFT', label: 'Draft'},
    {value: 'ARCHIVED', label: 'Archived'},
  ]

  const renderItem = (item:{}) => {
    return (
      <a 
        className='justClickable' 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          // TODO - load translation
          setSelectedResource(item);
        }}>
        <InlineStack gap='100' wrap={false}>
          {item.image ? (
            <Thumbnail
              source={item.image.preview.image.url + '&width=24'}
              size="extraSmall"
              alt={item.title}
            />
          ) : (
            <Thumbnail
              source={ImageIcon}
              size="extraSmall"
              alt={item.title}
            />
          )}
          <Text as='p' variant='headingSm'>{item.title}</Text>
        </InlineStack>
      </a>
    )
  }
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
                <div style={{background:'#fff',height:'100%',overflow:'auto',position:'relative'}}>
                    {isResourceLoading && (<LoadingScreen position='absolute' />)}
                    <Box padding='200'>
                      <InlineStack align='space-between' blockAlign='center'>
                        <Text as='p'>Showing {pagedResources.length} of {knownTotalPage} Items</Text>
                        <CheckListPop 
                          label={<Button icon={FilterIcon} accessibilityLabel='Filter' />} 
                          multiple={false} 
                          options={filters} 
                          checked={filters.length > 0 ? [filters[0].value] : []}
                          onChange={(selected: string) => {
                            // TODO
                            setFilterStatus(selected[0]);
                            console.log(selected);
                            // Initialize
                            setPage(0);
                            setCursor('');
                            setResources([]);
                            // setSelectedResource(false);
                            console.log('refreshing...', {cursor: '', perPage, status: selected[0]});
                            loadProducts({cursor: '', perPage, status: selected[0]});
                          }} 
                        />
                      </InlineStack>
                    </Box>

                    <Divider/>

                    <div style={{
                      height: hasPagination ? 'calc(100% - 110px' : 'calc(100% - 50px',
                      overflow:'auto',
                    }}>
                      {/* {!isSelectedResourceIn && (
                        <div 
                          key={'collection-' + selectedResource.handle}
                          style={{
                            background: 'var(--p-color-bg-surface-brand-selected)',
                            padding: '10px 20px',
                          }}
                        >
                          { renderItem(selectedResource) }
                        </div>
                      )}

                      { (pagedResources.length > 0) ? pagedResources.map((x, i) => (
                        <div 
                          key={'collection-' + x.handle}
                          style={{
                            background: (x.handle == selectedResource.handle) ? 'var(--p-color-bg-surface-brand-selected)' : 'transparent',
                            padding: '10px 20px',
                          }}
                        >
                          { renderItem(x) }
                        </div>
                      )) : <SkeletonResources />} */}

                      { (pagedResources.length > 0) ? pagedResources.map((x, i) => (
                        <div 
                          key={'collection-' + x.handle}
                          style={{
                            background: (x.handle == selectedResource.handle) ? 'var(--p-color-bg-surface-brand-selected)' : 'transparent',
                            padding: '10px 20px',
                          }}
                        >
                          { renderItem(x) }
                        </div>
                      )) : <SkeletonResources />}

                    </div>
                    
                    {(hasPagination) && (
                      <Box padding='400' borderBlockStartWidth='0165' borderColor='border'>
                        <BlockStack inlineAlign='center'>
                          <Pagination
                            hasPrevious = {page > 0}
                            onPrevious={() => {
                              setPage((prevPage) => Math.max(prevPage - 1, 0));
                            }}
                            hasNext = {!isLastPage}
                            onNext={() => {
                              setPage((prevPage) => Math.min(prevPage + 1, knownTotalPage-1));
                            }}
                          />
                        </BlockStack>
                      </Box>
                    )}
                  
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
