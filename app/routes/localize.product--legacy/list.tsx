import { useState, useEffect } from 'react';
import { useFetcher } from "@remix-run/react";

import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
  Pagination,
  Divider,
  Thumbnail,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import { LoadingScreen } from 'app/components/LoadingScreen';
import { isSaveBarOpen } from 'app/components/Functions';
import { CheckListPop } from 'app/components/CheckListPop';

import { SkeletonResources } from '../../components/Skeletons';

interface ResourcePanelProps {
  onSelect: Function,
}

const defaultProps: ResourcePanelProps = {
  onSelect: () => {}
}

export const ResourcePanel = (props:ResourcePanelProps) => {
  
  props = {...defaultProps, ...props}
  const { onSelect } = props;
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  
  const fetcher = useFetcher();
  
  const [isResourceLoading, setIsResourceLoading] = useState(false);

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
  
  const selectResource = (item) => {
    setSelectedResource(item);
    onSelect(item);
  }

  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'product_list') {
        
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

  const loadProducts = (props:{}) => {
    // if (!isFirstLoad && isLastPage) return;
    setIsResourceLoading(true);
    const data = {
      cursor: props.cursor,
      perPage: props.perPage,
      status: props.status,
      action: 'product_list',
    };
    // console.log('list products...');
    fetcher.submit(data, { action: "/api", method: "post" });
    // submit(data, { method: "post" });
  };

  const loadProductsByState = () => {
    loadProducts({cursor, perPage, status: filterStatus});
  };

  useEffect(() => {
    // console.log('Is first load?', isFirstLoad, 'Should load?', shouldLoad, 'Is last page?', isLastPage, cursor, page);
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

          if (selectedResource.id == item.id) return; 

          if (isSaveBarOpen()) {
            shopify.toast.show("You have unsaved changes. ", {duration: 2000});
            shopify.saveBar.leaveConfirmation('translation-save-bar');
            return;
          }
          
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
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  return (
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
                document.body.classList.toggle('resource-panel--open', false);
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
  );
}
