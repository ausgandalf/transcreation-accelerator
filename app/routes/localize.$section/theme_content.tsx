import { useState, useEffect, useRef } from 'react';
import { useFetcher, useSearchParams } from "@remix-run/react";

import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
  Pagination,
  Divider,
  Thumbnail,
  EmptyState,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import { LoadingScreen } from 'app/components/LoadingScreen';
import { isSaveBarOpen } from 'app/components/Functions';
import { SkeletonResources } from '../../components/Skeletons';

import { getResourceTypesPerSection, contentList } from 'app/api/data';

import { ResourcePanelProps, defaultResourcePanelProps, TransReadDataType, TransReadResponseType } from './_types';
import { keyCodes } from 'ckeditor5';

const getFilteredTranslations = (pool:TransReadDataType, type:string) => {
  const filterd:TransReadDataType = {
    resourceId: pool.resourceId,
    translatableContent: [],
    translations: []
  };

  for (let i=0; i<pool.translatableContent.length; i++) {
    const item = pool.translatableContent[i];
    if (item.key.indexOf(contentList[type][keyword]) === 0) {
      filterd.translatableContent.push(item);
    }
  }

  for (let i=0; i<pool.translations.length; i++) {
    const item = pool.translations[i];
    if (item.key.indexOf(contentList[type][keyword]) === 0) {
      filterd.translations.push(item);
    }
  }

  return filterd;
}

const buildPools = (pool:false|TransReadDataType) => {

  const keys = Object.keys(contentList);
  keys.map((x, i) => {
    contentList[x].pool = {
      resourceId: pool.resourceId,
      translatableContent: [],
      translations: []
    }
  });

  if (!pool) return;

  for (let i=0; i<pool.translatableContent.length; i++) {
    const item = pool.translatableContent[i];
    keys.map((x, i) => {
      const itemKey = item.key;
      if (itemKey.indexOf(contentList[x].keyword) === 0) {
        contentList[x].pool.translatableContent.push(item);
      }
    })
  }

  for (let i=0; i<pool.translations.length; i++) {
    const item = pool.translations[i];
    keys.map((x, i) => {
      if (item.key.indexOf(contentList[x].keyword) === 0) {
        contentList[x].pool.translations.push(item);
      }
    })
  }

  // console.log(contentList);
}

export const ResourcePanel = (props:ResourcePanelProps) => {
  
  props = {...defaultResourcePanelProps, ...props}
  const { selected, section, visible, theme, onSelect, onInject, setLoading, locale, market } = props;
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  
  const resourceTypesPerSection = getResourceTypesPerSection();

  const fetcher = useFetcher();
  
  const [searchParams, setSearchParams] = useSearchParams();

  const [isResourceLoading, setIsResourceLoading] = useState(false);

  const perPage = 250; // Let's keep this fixed for now
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(selected);
  const [pagedResources, setPagedResources] = useState([]);
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState(''); // if empty, means reached to the end.
  const [knownTotalPage, setKnownTotalPage] = useState(0);

  const [isPoolBuilt, setIsPoolBuilt] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('');
  const [currentMarket, setCurrentMarket] = useState('');

  const [translationsPool, setTranslationsPool] = useState<TransReadDataType[]>([]);
  const [previousLoadedKey, setPreviousLoadedKey] = useState('');

  

  const totalPage = Math.ceil(resources.length / perPage);
  const isFirstLoad = useRef(true);
  const isLastPage = (cursor == '') && !(page < totalPage - 1);
  const shouldLoad = (cursor != '') && !(page < totalPage);
  const hasPagination = (page > 0) || !isLastPage;
  
  const selectResource = (item) => {

    const searchParamValues = ((prev) => {
      // prev.delete('highlight');
      prev.set('item', item.item);
      return prev;
    })(searchParams);

    setSelectedResource(item);


    // const fakeResponse:TransReadResponseType = {
    //   action: 'content_read',
    //   idTypes: {[item.id]: 'ONLINE_STORE_THEME_LOCALE_CONTENT'},
    //   input: {
    //     action: "content_read",
    //     id:"gid://shopify/Product/15196767781199",
    //     market: market.id,
    //     locale: locale.locale
    //   },
    //   resource: {
    //     id: item.id
    //   },
    //   transdata: [contentList[item.item].pool]
    // }

    // onSelect(item, searchParamValues, section, fakeResponse);

    onSelect(item, searchParamValues, section);
  }

  const triggerInjection = (resourceItem:any, force:boolean = false) => {
    if (!resourceItem) return;
    if (!force) {
      if (!isPoolBuilt) return;
      if (('locale' in resourceItem) && ('market' in resourceItem)) {
        if (!((currentLocale == resourceItem.locale) && (currentMarket == resourceItem.market))) return;
      }
    }

    setLoading(true);
    const fakeResponse:TransReadResponseType = {
      action: 'content_read',
      idTypes: {[resourceItem.id]: 'ONLINE_STORE_THEME_LOCALE_CONTENT'},
      input: {
        action: "content_read",
        id:"gid://shopify/Product/15196767781199",
        market: market.id,
        locale: locale.locale
      },
      resource: {
        id: resourceItem.id
      },
      transdata: [contentList[resourceItem.item].pool]
    }
    console.log('injecting...', resourceItem, section, fakeResponse);
    onInject(resourceItem, section, fakeResponse);
    setLoading(false);
  }

  useEffect(() => {
    console.log('selection updated:', selected);
    // if (!selectedResource || (selected.item != selectedResource.item)) {
    //   if (isPoolBuilt) {
    //     selectResource(selected);
    //   }
    // }
    setSelectedResource(selected);
    triggerInjection(selected);
  }, [selected]);

  // useEffect(() => {
  //   triggerInjection(selectedResource);
  // }, [selectedResource]);

  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'resource_list') {

        if (!((fetcher.data.input.locale == locale.locale) && (fetcher.data.input.market == market.id))) return;

        let itemIdValue = '';
        if (fetcher.data.resources.nodes.length > 0) {
          itemIdValue = fetcher.data.resources.nodes[0]['resourceId'];
          
          setTranslationsPool(fetcher.data.resources.nodes);
          buildPools(fetcher.data.resources.nodes[0]);

          setIsPoolBuilt(true);
          setCurrentLocale(fetcher.data.input.locale);
          setCurrentMarket(fetcher.data.input.market);

        } else {
          setTranslationsPool([]);
          buildPools(false);
        }

        // setKnownTotalPage(fetcher.data.total);
        setKnownTotalPage(Object.keys(contentList).length);
        setCursor(''); // Disable loading
        const newResources = Object.keys(contentList).map((x, i) => ({
          id: itemIdValue,
          item: x,
          title: contentList[x]['label']
        }));

        setResources(newResources);
        
        if (selectedResource) {
          console.log('selecting...', selectedResource);
          selectResource(selectedResource);
          triggerInjection(selectedResource, true);
        } else {
          console.log('selecting...first...item');
          if (newResources.length > 0) {
            selectResource(newResources[0]);
            // triggerInjection(newResources[0]);
          }
        }
        
        // Remove loading anim
        setLoading(false);
        setIsResourceLoading(false);
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    let showingResources = resources.slice(page * perPage, (page + 1) * perPage);
    if (selectedResource) {
      const isIncluded = showingResources.some((x) => {
        if (x.handle == selectedResource?.handle) {
          // selectResource(x); // Do reselect to reflect recent info
          return true;
        } else {
          return false;
        }
      });
      if (!isIncluded) {
        showingResources = [selectedResource, ...showingResources];
      }
    }
    setPagedResources(showingResources);
  }, [resources, page]);

  const loadResources = (props:{}) => {
    // if (!isFirstLoad && isLastPage) return;
    setIsPoolBuilt(false);
    setIsResourceLoading(true);
    const data = {
      type: resourceTypesPerSection[section][0],
      cursor: props.cursor,
      perPage: props.perPage,
      market: market.id,
      locale: locale.locale,
      action: 'resource_list',
      theme: theme.id.split('/').pop(),
    };
    // console.log('list products...');
    fetcher.submit(data, { action: "/api", method: "post" });
    // submit(data, { method: "post" });
  };

  const doLoadResources = () => {
    if (previousLoadedKey == (`${locale.locale}-${market.id}`)) return;
    console.log('loading...resources...for...', `${locale.locale}-${market.id}`);
    setLoading(true);
    setPreviousLoadedKey(`${locale.locale}-${market.id}`);
    loadResources({cursor, perPage});
  };

  useEffect(() => {
    // console.log('Is first load?', isFirstLoad, 'Should load?', shouldLoad, 'Is last page?', isLastPage, cursor, page);
    // console.log('useEffect checker:', resources, page, isFirstLoad, shouldLoad);
    if (isFirstLoad.current || shouldLoad) doLoadResources();
    isFirstLoad.current = false;
  }, [page]);

  useEffect(() => {
    doLoadResources();
  }, [market, locale]);

  const renderItem = (item:{}) => {
    return (
      <a 
        className='justClickable' 
        href="#" 
        onClick={(e) => {
          e.preventDefault();

          if (selectedResource.item == item.item) return; 

          if (isSaveBarOpen()) {
            shopify.toast.show("You have unsaved changes. ", {duration: 2000});
            shopify.saveBar.leaveConfirmation('translation-save-bar');
            return;
          }
          
          selectResource(item);

        }}>
        <InlineStack gap='100' wrap={false}>
          <Text as='p' variant='headingSm'>{item.title}</Text>
        </InlineStack>
      </a>
    )
  }
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  return (
    <div className='panel panel--resource' 
      style={{
        background:'#fff',
        height:'100%', 
        position:'relative', 
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto auto 1fr auto',
        display: visible ? 'grid':'none'
      }}>
        {isResourceLoading && (<LoadingScreen position='absolute' />)}
        <Box padding='200'>
          <InlineStack align='space-between' blockAlign='center'>
            <Text as='p'>Showing {pagedResources.length} of {knownTotalPage} Items</Text>
          </InlineStack>
        </Box>

        <Divider/>

        <div style={{
          // height: hasPagination ? 'calc(100% - 110px' : 'calc(100% - 50px',
          overflow:'auto',
        }}>
          {/* {(pagedResources.length < 1) && (
            <EmptyState
              heading="No products found."
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Please try new search.</p>
            </EmptyState>
          )} */}
          
          { (pagedResources.length > 0) ? pagedResources.map((x, i) => (
            <div 
              key={'resource-' + x.item}
              className={'item' + ((x.item == selectedResource.item) ? ' selected' : '')}
              // style={{
              //   background: (x.handle == selectedResource.handle) ? 'var(--p-color-bg-surface-brand-selected)' : 'transparent',
              //   padding: '10px 20px',
              // }}
            >
              { renderItem({...x, market:market.id, locale:locale.locale}) }
            </div>
          )) : (isResourceLoading ? (<SkeletonResources />) : (
            <EmptyState
              heading="No items found"
              image="data:image/svg+xml,%3csvg%20width='60'%20height='100'%20viewBox='0%200%2020%2020'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M2%208c0-3.309%202.691-6%206-6s6%202.691%206%206-2.691%206-6%206-6-2.691-6-6zm17.707%2010.293l-5.395-5.396A7.946%207.946%200%200016%208c0-4.411-3.589-8-8-8S0%203.589%200%208s3.589%208%208%208a7.954%207.954%200%20004.897-1.688l5.396%205.395A.998.998%200%200020%2019a1%201%200%2000-.293-.707z'%20fill='%238C9196'/%3e%3c/svg%3e"
            >
            </EmptyState>
          ))}

        </div>
        
        <Box padding='400' borderBlockStartWidth={hasPagination ? '0165' : '0'} borderColor='border'>
          {(hasPagination) && (
            <Box>
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
        </Box>
      
    </div>
  );
}
