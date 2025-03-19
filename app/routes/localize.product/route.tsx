import {useState, useEffect, useReducer, useMemo, useCallback} from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useOutletContext, useLoaderData, useNavigate, useNavigation, useFetcher, useActionData, useSubmit, useSearchParams } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Redirect, Fullscreen } from "@shopify/app-bridge/actions";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";

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
  TextField,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
  ExternalIcon,
  MaximizeIcon,
} from '@shopify/polaris-icons';

import polarisTranslations from "@shopify/polaris/locales/en.json";

import { authenticate, login } from "../../shopify.server";

import { SelectPop } from 'app/components/SelectPop';
import { MarketsPop } from 'app/components/MarkertsPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect, makeReadable, enterFullscreen, exitFullscreen } from 'app/components/Functions';
import { getProducts, getProduct, getTranslationsByIds, setTranslations } from 'app/api/App';
import { CheckListPop } from 'app/components/CheckListPop';

import { thStyle, cellStyle, sourceCellStyle, xtraCellStyle, targetCellStyle, textareaStyle } from "app/res/style";
import { Skeleton, SkeletonResources, SkeletonTranslation, SkeletonTranslationContent } from './skeleton';
import { transKeys } from 'app/api/data';
import { Editor } from 'app/components/Editor';

import { validateHeaderName } from 'http';


export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);

  return {
    init: true, 
    path: '/localize/product',
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

  let result:any = {};
  if (data.action == 'list') {
    // Load Collection data
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getProducts(admin.graphql, data.cursor, data.status, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'read') {
    // Load Product info
    let product:any = false;
    let endLoop = false;
    while (!endLoop) {
      try {
        product = await getProduct(admin.graphql, data.id);
        endLoop = true;
      } catch (e) {}
    }

    if (product) {
      let ids = [ product.id ];
      product.options.map((x, i) => {
        ids.push(x.id);
        x.optionValues.map((y, j) => {
          ids.push(y.id);
        })
      })
    
      // Load Translation data
      endLoop = !product; // We fetch translation data only when product is found.
      while (!endLoop) {
        try {
          result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), data.locale, data.market);
          endLoop = true;
        } catch (e) {}
      }
    }

    result['product'] = product; // Put product info
    
  } else if (data.action == 'submit') {
    // Load Translation data
    const translationsObj = JSON.parse(data.translations);
    for (let i=0; i<translationsObj.length; i++) {
      let endLoop = false;
      while (!endLoop) {
        try {
          result = await setTranslations(admin.graphql, translationsObj[i].id, translationsObj[i].data);
          endLoop = true;
        } catch (e) {}
      }
    }
  }

  return Response.json({ ...result, input:data, action:data.action });
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
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);

  // const [searchParams, setSearchParams] = useSearchParams();
  
  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "save";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  useEffect(() => {
    // console.log(nav);
    // setIsLoading(nav.state === "loading");
  }, [nav])

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const context = useOutletContext();
  const [currentLocale, setCurrentLocale] = useState(context.locale);
  const [currentMarket, setCurrentMarket] = useState(context.market);

  useEffect(() => {
    setCurrentLocale(context.locale);
    setCurrentMarket(context.market);
  }, [context])

  function returnHome() {
    setIsLoading(true);
    navigate(`/?shopLocale=${currentLocale.locale}`);

    // getRedirect(shopify).dispatch(
    //   Redirect.Action.APP,
    //   `/?shopLocale=${currentLocale.locale}`,
    // )
  }

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  function formStateReducer(state, action) {
    // console.log('reducer....', state, action);
    if (action.type === 'init') {
      return structuredClone(action.translations);
    } else if (action.type === 'setTraslation') {
      const id = action.id;
      const key = action.traslation.key;
      const v = action.traslation.value.trim();
      if (v == '') {
        if (key in state[id]) delete state[id][key]; 
      } else {
        state[id][key] = {...action.traslation}
      }
      return structuredClone(state);
    }
    // console.log(state, action);
    throw Error('Unknown action in formStateReducer() found.');
  }

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


  const [transData, setTransData] = useState({});
  const [transDataObject, setTransDataObject] = useState({});
  const [productInfoIds, setProductInfoIds] = useState({});
  const [currentTranslateMarketLocale, setCurrentTranslateMarketLocale] = useState('');

  const [formState, formStateDispatch] = useReducer(formStateReducer, {});
  const [cleanFormState, setCleanFormState] = useState({});
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show('translation-save-bar');
    } else {
      shopify.saveBar.hide('translation-save-bar');
    }
  }, [formState, cleanFormState])

  const getTransSourceObj = (resources: [], key: string) => {
    let transObj = {};
    const foundTransObj = resources.some((x) => {
      if (x.key == key) {
        transObj = {...x};
        return true;
      }
    })
    if (!foundTransObj) {
      // console.log(resources, key);
      throw Error('Unknown translation key found in getTransSourceObj() funciton.');
    }
    return transObj;
  }

  const updateTranslation = (id: string, key: string, translation: string) => {
    try {
      // let transObj = getTransSourceObj(transData[id], key);
      let transObj = {...transDataObject[id][key]};
      transObj.locale = currentLocale.locale;
      transObj.value = translation;
      transObj.translatableContentDigest = transObj.digest;
      delete transObj.digest;
      delete transObj.type;

      formStateDispatch({ 
        type: 'setTraslation',
        id: id,
        traslation: transObj,
      });
    } catch (e) {
      // TODO
      // console.log(e);
    }
  }

  const getTranslatedValue = useCallback((id: string, key: string) => {
    if ((id in formState) && (key in formState[id])) {
      return formState[id][key].value;
    } else {
      return '';
    }
  }, [formState])

  const submitTranslations = () => {
    var translations = [];

    for (var id in formState) {
      let trans = [];
      for (var key in formState[id]) {
        trans.push(formState[id][key]);
      }
      translations.push({
        id,
        data: trans
      });
    }
    
    setIsLoading(true);
    const data = {
      translations: JSON.stringify(translations),
      id: selectedResource.id,
      market: currentMarket.id,
      action: 'submit',
    };
    // console.log('submitting translations ...', data);
    fetcher.submit(data, { method: "post" });
  };

  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'list') {
        
        setKnownTotalPage(fetcher.data.total);
        if (fetcher.data.products.pageInfo.hasNextPage) {
          setCursor(fetcher.data.products.pageInfo.endCursor);
        } else {
          setCursor(''); // Disable loading
        }
        const newResources = [...resources, ...fetcher.data.products.nodes];
        setResources(newResources);

        // Select first resource, if nothing selected.
        if (!selectedResource && (fetcher.data.products.nodes.length > 0)) selectResource(fetcher.data.products.nodes[0]);
        
        // Remove loading anim
        setIsResourceLoading(false);

      } else if (fetcher.data.action == 'read') {
        // TODO
        if (fetcher.data.transdata && (fetcher.data.product.id == selectedResource.id)) {

          setProductInfoIds({...fetcher.data.product});
          setCurrentTranslateMarketLocale(fetcher.data.input.locale + '-' + fetcher.data.input.market);
          // Init form state
          let translatableData = {};
          let translatableDataObj = {};
          let transData = {};
          fetcher.data.transdata.map((x, i) => {
            
            translatableData[x.resourceId] = structuredClone(x.translatableContent);

            translatableDataObj[x.resourceId] = {};
            x.translatableContent.map((y, j) => {
              translatableDataObj[x.resourceId][y.key] = {...y};
            });

            transData[x.resourceId] = {};
            x.translations.map((y, j) => {
              // let obj = getTransSourceObj(x.translatableContent, y.key);
              let obj = {...translatableDataObj[x.resourceId][y.key]};
              obj.locale = currentLocale.locale;
              obj.value = y.value;
              obj.translatableContentDigest = obj.digest;
              delete obj.digest;
              delete obj.type;
              transData[x.resourceId][y.key] = {...obj};
            });
          });

          setTransData(translatableData);
          setTransDataObject(translatableDataObj);

          formStateDispatch({type: 'init', translations: transData});
          setCleanFormState(transData);
          
          // Remove loading anim
          setIsTranslationLoading(false);
        }
      } else if (fetcher.data.action == 'submit') {
        // TODO
        setCleanFormState(structuredClone(formState));
        setIsLoading(false);
        shopify.toast.show("The translations have been saved.", {duration: 2000});
      }
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
    // console.log('reload by market, locale change...');
    if (selectedResource) {
      if (currentTranslateMarketLocale != (currentLocale.locale + '-' + currentMarket.id))
        selectResource(selectedResource); // Reload translation data
    }
  }, [currentMarket, currentLocale]);

  useEffect(() => {
    if (init) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 0);
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
    // console.log('list products...');
    fetcher.submit(data, { method: "post" });
    // submit(data, { method: "post" });
  };

  const loadProductsByState = () => {
    loadProducts({cursor, perPage, status: filterStatus});
  };

  useEffect(() => {
    // console.log('Is first load?', isFirstLoad, 'Should load?', shouldLoad, 'Is last page?', isLastPage, cursor, page);
    if (isFirstLoad || shouldLoad) loadProductsByState();
  }, [resources, page]);

  const selectResource = (item) => {
    setSelectedResource(item);
    setIsTranslationLoading(true);
    const data = {
      id: item.id,
      locale: currentLocale.locale,
      market: currentMarket.id,
      action: 'read',
    };
    // console.log('Read translation data...');
    fetcher.submit(data, { method: "post" });
  }

  function getLanguageLabel(locale:string) {
    let label = '';
    context.locales.some((x, i) => {
      if (x.locale == locale) {
        label = x.name;
        return true;
      }
    })
    return label;
  }

  function getKeyLabel(key:string) {
    if (key in transKeys) {
      return transKeys[key].label;
    } else {
      return makeReadable(key);
    }
  }

  function getKeyType(key:string) {
    if (key in transKeys) {
      return transKeys[key].type;
    } else {
      return 'text';
    }
  }

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
          selectResource(item);
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

  const renderTransSource = (type: string, value:string) => {
    if (type == 'HTML') {
      return (<Editor text={value} readOnly={true}/>)
      return;
    } else {
      return (
        <Text as='p'>{value}</Text>
      )
    }
  }

  const renderTransEditor = (type: string, id:string, key:string) => {
    if (type == 'HTML') {
      return (<Editor text={getTranslatedValue(id, key)} onChange={(text:string) => updateTranslation(id, key, text)}/>)
      return;
    } else {
      return (
        // Single line text
        <textarea 
          className='text--input'
          value={getTranslatedValue(id, key)} 
          onKeyDown={e => (e.key == "Enter") ? e.preventDefault() : ''}
          onChange={e => updateTranslation(id, key, e.target.value)}
          style={textareaStyle}
        ></textarea>
      )
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

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
                        url: context.shop,
                        newContext: true,
                      }
                    )
                  }}>View Store</Button>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      submitTranslations();
                    }}
                    disabled = {!isDirty}
                    >
                    Save
                  </Button>
                </ButtonGroup>
              </div>
            </FullscreenBar>
          </Box>

          <div className='fullscreenLayout withTopBar'>
            <div className='layout layout--translate'>
              <div className='layout__section layout__section--resource'>
                <div className='panel panel--resource' style={{background:'#fff',height:'100%', position:'relative'}}>
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

                            // Initialize
                            setPage(0);
                            setCursor('');
                            setResources([]);

                            // console.log('refreshing...', {cursor: '', perPage, status: selected[0]});
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

                      { (pagedResources.length > 0) ? pagedResources.map((x, i) => (
                        <div 
                          key={'product-' + x.handle}
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
              </div>
              
              <div className='layout__section layout__section--translate'>
                <div style={{height:'100%',overflow:'auto',position:'relative'}}>

                  {isTranslationLoading && (<LoadingScreen position='absolute' />)}

                  <Box padding='400'>
                    {(selectedResource) ? (
                      <BlockStack gap='400'>
                        <InlineStack align='space-between' blockAlign='center'>
                          <InlineStack gap='100'>
                            {selectedResource.image ? (
                              <Thumbnail
                                source={selectedResource.image.preview.image.url + '&width=24'}
                                size="small"
                                alt={selectedResource.title}
                              />
                            ) : (
                              <Thumbnail
                                source={ImageIcon}
                                size="small"
                                alt={selectedResource.title}
                              />
                            )}

                            <a className='link--external' href="#" onClick={(e) => {
                              e.preventDefault();
                              getRedirect(shopify).dispatch(
                                Redirect.Action.ADMIN_SECTION, {
                                  section: {
                                    name: Redirect.ResourceType.Product,
                                    resource: {
                                      id: selectedResource.id.split('/').pop(),
                                    },
                                  },
                                  newContext: true,
                                }
                              )
                            }}>
                              <InlineStack wrap={false} gap='200'>
                                <Text as='h2' variant='headingLg'>{selectedResource.title}</Text>
                                <Icon source={ExternalIcon} />
                              </InlineStack>
                            </a>
                          </InlineStack>
                          <Box>
                            <Button variant='secondary'>Auto-translate</Button>
                          </Box>

                        </InlineStack>

                        {isTranslationLoading ? (<SkeletonTranslationContent />) : (
                          <BlockStack gap='400'>
                          
                            <Card padding='0'>
                              <table className='table table--translate' width='100%' cellSpacing='0' cellPadding='0'>
                                <thead>
                                  <tr><th colSpan={3} style={{padding:'var(--p-space-600) var(--p-space-400)', gridColumn: '1 / -1',}}>
                                    <Text as="p" variant="headingMd" alignment="start">Product</Text>
                                  </th></tr>
                                  <tr>
                                    <th style={thStyle}></th>
                                    <th style={thStyle}><Text as='p' tone='subdued' alignment='start'>Reference</Text></th>
                                    <th style={thStyle}><Text as='p' tone='subdued' alignment='start'>{currentLocale.name}</Text></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transData[productInfoIds.id].map((x, i) => (
                                    <tr key={'transmain-tr--' + i}>
                                      <td width='20%' style={cellStyle}>
                                        <BlockStack gap='100'>
                                          <Text as='p' variant='headingSm'>{getKeyLabel(x.key)}</Text>
                                          <Text as='p' tone='subdued' variant='bodySm'>Source: {getLanguageLabel(x.locale)}</Text>
                                        </BlockStack>
                                      </td>
                                      <td width='40%' className='cell cell--source' style={{...cellStyle, ...sourceCellStyle, ...xtraCellStyle(x.type)}}>
                                        {renderTransSource(x.type, x.value)}
                                      </td>
                                      <td width='40%' className='cell cell--target' style={{...cellStyle, ...targetCellStyle}}>
                                        {renderTransEditor(x.type, productInfoIds.id, x.key)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </Card>

                            <Card padding='0'>
                              <table className='table table--translate' width='100%' cellSpacing='0' cellPadding='0'>
                                <thead>
                                  <tr><th colSpan={3} style={{padding:'var(--p-space-600) var(--p-space-400)', gridColumn: '1 / -1',}}>
                                    <Text as="p" variant="headingMd" alignment="start">Product options</Text>
                                  </th></tr>
                                  <tr>
                                    <th style={thStyle}></th>
                                    <th style={thStyle}><Text as='p' tone='subdued'>Reference</Text></th>
                                    <th style={thStyle}><Text as='p' tone='subdued'>{currentLocale.name}</Text></th>
                                  </tr>
                                </thead>
                                
                                {productInfoIds.options.map((x, i) => (
                                  <tbody key={'transopt-tbody--' + i}>
                                    <tr>
                                      <td width='20%' style={cellStyle}>
                                        <BlockStack gap='100'>
                                          <Text as='p' variant='headingSm'>Option name</Text>
                                          {/* <Text as='p' tone='subdued' variant='bodySm'>{x.name}</Text> */}
                                          <Text as='p' tone='subdued' variant='bodySm'>Source: {getLanguageLabel(transDataObject[x.id]['name'].locale)}</Text>
                                        </BlockStack>
                                      </td>
                                      <td width='40%' className='cell cell--source' style={{...cellStyle, ...sourceCellStyle, ...xtraCellStyle(x.type)}}>
                                        {renderTransSource(x.type, transDataObject[x.id]['name'].value)}
                                      </td>
                                      <td width='40%' className='cell cell--target' style={{...cellStyle, ...targetCellStyle}}>
                                        {renderTransEditor(x.type, x.id, 'name')}
                                      </td>
                                    </tr>

                                    {x.optionValues.map((ov,j) => (
                                      <tr key={'transopt-tr-ov--' + i + '-' + j}>
                                        {(j==0) && (
                                          <td width='20%' style={{...cellStyle, gridRow: 'span 2', }} rowSpan={x.optionValues.length}>
                                            <BlockStack gap='100'>
                                              <Text as='p' variant='headingSm'>{x.name}</Text>
                                              <Text as='p' tone='subdued' variant='bodySm'>Option values</Text>
                                              <Text as='p' tone='subdued' variant='bodySm'>Source: {getLanguageLabel(transDataObject[ov.id]['name'].locale)}</Text>
                                            </BlockStack>
                                          </td>
                                        )}

                                        <td width='40%' className='cell cell--source' style={{...cellStyle, ...sourceCellStyle, ...xtraCellStyle(x.type)}}>
                                          {renderTransSource(ov.type, transDataObject[ov.id]['name'].value)}
                                        </td>
                                        <td width='40%' className='cell cell--target' style={{...cellStyle, ...targetCellStyle}}>
                                          {renderTransEditor(ov.type, ov.id, 'name')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                ))}
                              </table>
                            </Card>
                            
                      
                          </BlockStack>
                        )}


                      </BlockStack>
                    ) : (
                      <SkeletonTranslation />
                    )}
                    
                  </Box>
                </div>
              </div>  
            </div>
          </div>


        </Box>
      )}

      <SaveBar id="translation-save-bar">
        <button variant="primary" onClick={() => {
          submitTranslations();
          shopify.saveBar.hide('translation-save-bar');
        }}></button>
        <button id="discard-button" onClick={() => {
          formStateDispatch({type: 'init', translations: cleanFormState});
          shopify.saveBar.hide('translation-save-bar');
        }}></button>
      </SaveBar>

    </Box>
  );
}
