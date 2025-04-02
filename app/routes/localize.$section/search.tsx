import { useState, useEffect } from 'react';
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
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import { LoadingScreen } from 'app/components/LoadingScreen';
import { isSaveBarOpen, extractId } from 'app/components/Functions';
import { CheckListPop } from 'app/components/CheckListPop';

import { SkeletonResources } from '../../components/Skeletons';
import { search } from '@shopify/app-bridge/actions/Picker';

interface SearchPanelProps {
  q?: string,
  visible: boolean,
  section?: string,
  markets: [],
  onSelect: Function,
}

const defaultProps: SearchPanelProps = {
  q: '',
  visible: true,
  section: 'product',
  markets: [],
  onSelect: () => {}
}

export const SearchPanel = (props:SearchPanelProps) => {
  
  props = {...defaultProps, ...props}
  const { q, visible, section, onSelect, markets } = props;
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  
  const fetcher = useFetcher();
  
  const [isResourceLoading, setIsResourceLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();



  const perPage = 10; // Let's keep this fixed for now
  const [keyword, setKeyword] = useState(q);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const lastPage = Math.floor(total / perPage);
  const hasPagination = (lastPage > 0);
  const hasNext = (page < lastPage);
  const hasPrev = (page > 0);
  
  
  const [resources, setResources] = useState({});
  const [selectedResource, setSelectedResource] = useState({});

  const selectResource = (item, parentItem) => {
    console.log(item);
    if (selectedResource.id == item.id) return;

    const searchParamValues = ((prev) => {

      if (extractId(item.parentId) == item.resourceId) {
        prev.set("highlight", item.field);
      } else {
        prev.set("highlight", item.resourceId);
      }


      if (item.locale && (prev.get('shopLocale') != item.locale)) {
        prev.set("shopLocale", item.locale);
      }
      if (!item.market) {
        prev.delete('market');
      } else if (prev.get('market') != item.market) {
        let marketHandle = '';
        markets.some((x, i) => {
          if (x.name == item.market) {
            marketHandle = x.handle;
            return true;
          }
        })
        if (marketHandle) prev.set("market", marketHandle);
      }
      return prev;
    })(searchParams);

    setSelectedResource(item);
    onSelect(parentItem, searchParamValues);
  }

  useEffect(() => {
    setKeyword(q);
  }, [q]);

  useEffect(() => {
    setSelectedResource({});
  }, [visible]);

  useEffect(() => {
    find();
  }, [keyword, page]);


  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'trans_find') {
        
        const {total, result} = fetcher.data.result;
        setTotal(total);

        console.log(result);
        
        setResources(structuredClone(result));
        setIsResourceLoading(false);

      }
    }
  }, [fetcher.data]);

  const find = () => {
    console.log(keyword, page);
    if (keyword.length < 2) return;
    
    setIsResourceLoading(true);
    const data = {
      q: keyword,
      perPage,
      page,
      action: 'trans_find',
    };
    
    fetcher.submit(data, { action: "/api", method: "post" });
  };

  const filters = [
    {value: '', label: 'All'},
    {value: 'ACTIVE', label: 'Active'},
    {value: 'DRAFT', label: 'Draft'},
    {value: 'ARCHIVED', label: 'Archived'},
  ]

  const renderItem = (item:{}, parentItem:{}) => {
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
          
          selectResource(item, parentItem);

        }}>
        <InlineStack gap='100' wrap={false}>
          {/* {item.image ? (
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
          )} */}
          <Text as='p' variant='bodyMd'><span dangerouslySetInnerHTML={{__html: item.highlight}}></span></Text>
        </InlineStack>
      </a>
    )
  }
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  return (
    <div className='panel panel--resource' style={{background:'#fff',height:'100%', position:'relative', display: visible ? 'block':'none'}}>
        {isResourceLoading && (<LoadingScreen position='absolute' />)}
        <Box padding='200'>
          <InlineStack align='space-between' blockAlign='center'>
            <Text as='p'>Showing # of # Items</Text>
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

          {Object.keys(resources).map((key, index) => {
            const parentItem = resources[key].info;
            return (
              <div key={'search-section-' + parentItem.id} className='item-blocks'>
                <div className='item item--section'>
                  <Text as='p' variant='headingMd'>{parentItem.title}</Text>
                </div>
                {resources[key].items.map((x, i) => (
                  <div 
                    key={'search-' + x.id}
                    className={'item' + ((x.id == selectedResource.id) ? ' selected' : '')}
                  >
                    { renderItem(x, parentItem) }
                  </div>
                ))}
              </div>
            );
          })}

        </div>
        
        {hasPagination && (
          <Box padding='400' borderBlockStartWidth='0165' borderColor='border'>
            <BlockStack inlineAlign='center'>
              <Pagination
                hasPrevious = {hasPrev}
                onPrevious={() => {
                  // TODO
                  setPage((prev) => Math.max(0, prev - 1));
                }}
                hasNext = {hasNext}
                onNext={() => {
                  // TODO
                  setPage((prev) => Math.min(lastPage, prev + 1));
                }}
              />
            </BlockStack>
          </Box>
        )}
      
    </div>
  );
}
