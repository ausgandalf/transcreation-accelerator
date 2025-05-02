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

import { getResourceTypesPerSection } from 'app/api/data';

import { ResourcePanelProps, defaultResourcePanelProps } from './_types';

export const ResourcePanel = (props:ResourcePanelProps) => {
  
  props = {...defaultResourcePanelProps, ...props}
  const { selected, section, visible, onSelect } = props;
  
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
  const [filterStatus, setFilterStatus] = useState('');

  const totalPage = Math.ceil(resources.length / perPage);
  const isFirstLoad = useRef(true);
  const isLastPage = (cursor == '') && !(page < totalPage - 1);
  const shouldLoad = (cursor != '') && !(page < totalPage);
  const hasPagination = (page > 0) || !isLastPage;
  
  const selectResource = (item) => {

    const searchParamValues = ((prev) => {
      prev.delete('highlight');
      return prev;
    })(searchParams);

    setSelectedResource(item);
    onSelect(item, searchParamValues, section);
  }

  useEffect(() => {
    setSelectedResource(selected);
  }, [selected]);

  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'resource_list') {
        
        setKnownTotalPage(fetcher.data.total);
        if (fetcher.data.resources.pageInfo.hasNextPage) {
          setCursor(fetcher.data.resources.pageInfo.endCursor);
        } else {
          setCursor(''); // Disable loading
        }
        
        const newResources = [...resources, ...fetcher.data.resources.nodes];
        // console.log('fetched', newResources);
        setResources(newResources);

        // Select first resource, if nothing selected.
        if (!selectedResource && (fetcher.data.resources.nodes.length > 0)) selectResource(fetcher.data.resources.nodes[0]);
        
        // Remove loading anim
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
    setIsResourceLoading(true);
    const data = {
      type: resourceTypesPerSection[section][0],
      cursor: props.cursor,
      perPage: props.perPage,
      action: 'resource_list',
    };
    // console.log('list products...');
    fetcher.submit(data, { action: "/api", method: "post" });
    // submit(data, { method: "post" });
  };

  const doLoadResources = () => {
    // console.log('loading...colleciton...');
    loadResources({cursor, perPage});
  };

  useEffect(() => {
    // console.log('Is first load?', isFirstLoad, 'Should load?', shouldLoad, 'Is last page?', isLastPage, cursor, page);
    // console.log('useEffect checker:', resources, page, isFirstLoad, shouldLoad);
    if (isFirstLoad.current || shouldLoad) doLoadResources();
    isFirstLoad.current = false;
  }, [page]);

  useEffect(() => {
    // Initialize the list

    setCursor('');
    setResources([]);
    setPage(0);

  }, [section]);

  const renderItem = (item:{}) => {
    return (
      <a 
        className='justClickable' 
        href="#" 
        onClick={(e) => {
          e.preventDefault();

          if (selectedResource.id == item.id) return; 

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
              key={'resource-' + x.id}
              className={'item' + ((x.id == selectedResource.id) ? ' selected' : '')}
              // style={{
              //   background: (x.handle == selectedResource.handle) ? 'var(--p-color-bg-surface-brand-selected)' : 'transparent',
              //   padding: '10px 20px',
              // }}
            >
              { renderItem(x) }
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
