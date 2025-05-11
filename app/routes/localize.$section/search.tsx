import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFetcher, useParams, useSearchParams } from "@remix-run/react";

import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
  Pagination,
  Divider,
  Thumbnail,
  Tag,
  EmptyState,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import { LoadingScreen } from 'app/components/LoadingScreen';
import { isSaveBarOpen, extractId, makeReadable } from 'app/components/Functions';
import { CheckListPop } from 'app/components/CheckListPop';
import { CheckListSectionsPop } from 'app/components/CheckListSectionsPop';
import { sections as translateSections, resourceTypePath, getResourceTypesPerSection } from 'app/api/data';
import { SkeletonResources } from '../../components/Skeletons';
import { search } from '@shopify/app-bridge/actions/Picker';

interface SearchPanelProps {
  q?: string,
  visible: boolean,
  section?: string,
  markets: [],
  locales: [],
  onSelect: Function,
}

const defaultProps: SearchPanelProps = {
  q: '',
  visible: true,
  section: 'product',
  markets: [],
  locales: [],
  onSelect: () => {}
}

export const SearchPanel = (props:SearchPanelProps) => {
  
  props = {...defaultProps, ...props}
  const { q, visible, section, onSelect, markets, locales } = props;
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  
  const resourceTypesPerSection = getResourceTypesPerSection();

  const fetcher = useFetcher();
  
  const [isResourceLoading, setIsResourceLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  const perPage = 10; // Let's keep this fixed for now
  const [keyword, setKeyword] = useState(q);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [fetchedTotal, setFetchedTotal] = useState(0);

  const [filters, setFilters] = useState({
    status: [''],
    locale: [searchParams.get('shopLocale')],
    section: [params.section],
  });

  const lastPage = Math.floor((total - 1) / perPage);
  const hasPagination = (lastPage > 0);
  const hasNext = (page < lastPage);
  const hasPrev = (page > 0);
  
  
  const [resources, setResources] = useState({});
  const [selectedResource, setSelectedResource] = useState({});

  const selectResource = (item, parentItem) => {
    // console.log(item);
    if (selectedResource.id == item.id) return;

    let marketHandle = '';
    if (item.market) {
      markets.some((x, i) => {
        if (x.name == item.market) {
          marketHandle = x.handle;
          return true;
        }
      })
    }

    const searchParamValues = ((prev) => {
      if (item.resourceType == 'ONLINE_STORE_THEME_LOCALE_CONTENT') {
        prev.set("highlight", item.field);
      } else if (extractId(item.parentId) == item.resourceId) {
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
        if (marketHandle) prev.set("market", marketHandle);
      }

      if (parentItem.item) {
        prev.set("item", parentItem.item);
      }

      return prev;
    })(searchParams);

    setSelectedResource(item);
    onSelect({...parentItem, locale:item.locale, market:marketHandle}, searchParamValues, resourceTypePath[item.resourceType]);
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
    setPage(0);
    (() => find())();
  }, [filters]);


  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'trans_find') {
        
        const {total, found, result} = fetcher.data.result;
        setTotal(total);
        setFetchedTotal(found);
        // console.log(result);
        
        setResources(structuredClone(result));
        setIsResourceLoading(false);

      }
    }
  }, [fetcher.data]);

  const find = () => {
    // console.log(keyword, page);
    if (keyword.length < 2) {
      setResources([]);
      return;
    }
    
    setIsResourceLoading(true);
    const data = {
      q: keyword,
      perPage,
      page,
      status: filters.status[0],
      types: filters.section.reduce((result, item) => {
        const sections = resourceTypesPerSection[item];
        if (sections) {
          result = result + (result ? '|' : '') + resourceTypesPerSection[item].join('|');  
        }
        return result;
      }, ''),
      locales: filters.locale.reduce((result, item) => result + (result ? '|' : '') + item, ''),
      action: 'trans_find',
    };
    
    fetcher.submit(data, { action: "/api", method: "post" });
  };

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

  const sections = [
    // {
    //   title: 'Translation status',
    //   key: 'status',
    //   multiple: false,
    //   choices: [
    //     {label: 'All', value: ''},
    //     {label: 'Translated', value: 'translated'},
    //     {label: 'Not translated', value: 'not-translated'},
    //   ]
    // },
    {
      title: 'Language',
      key: 'locale',
      multiple: true,
      choices: locales.map((locale, i) => ({label: locale.name, value:locale.locale})),
      hasClear: true,
    },
    {
      title: 'Resource type',
      key: 'section',
      multiple: true,
      choices: translateSections.reduce((result, section) => {
        const subItems = section.items.map((item, j) => ({label: item.content, value:item.url.split('/').pop()}));
        return [...result, ...subItems]
      }, []).sort(function(a, b) {
        if (a.label < b.label) return -1;
        if (a.label > b.label) return 1;
        return 0;
      }),
      hasClear: true,
    }
  ];

  const filterLabel = (key:string, value:string) => {
    
    let label = makeReadable(value);

    sections.some((section) => {
      if (section.key == key) {
        section.choices.some((item) => {
          if (item.value == value) {
            label = item.label;
            return true;
          }
        })
        return true;
      }
    })

    return label;
  };
  
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
          <BlockStack>
            <InlineStack align='space-between' blockAlign='center'>
              <Text as='p'>Showing {fetchedTotal} of {total} Items</Text>
              <CheckListSectionsPop 
                label={<Button icon={FilterIcon} accessibilityLabel='Filter' />} 
                checked = {filters}
                sections={sections} 
                onChange={(selected: string[], section:string) => {
                  // TODO
                  document.body.classList.toggle('resource-panel--open', false);

                  const newSelected = {...filters, ...{[section]:selected}};
                  setFilters(newSelected);

                  // Initialize
                  setPage(0);
                  
                  // setResources([]);

                  // console.log('refreshing...', {cursor: '', perPage, status: selected[0]});
                  // loadProducts({cursor: '', perPage, status: selected[0]});
                }} 
              />
            </InlineStack>
            <Box>
              <InlineStack gap='100'>
                {Object.keys(filters).map((key, i) => 
                  filters[key].filter((filter) => (filter != '')).map((filter, j) => (<Tag key={`filter-${filter}-${i}-${j}`} onRemove={() => {
                    // TODO
                    const newFilters = filters[key].filter((item) => (item != filter));
                    setFilters((prevFilters) => ({...prevFilters, [key]:newFilters}));
                  }}>{filterLabel(key, filter)}</Tag>))
                )}
              </InlineStack>
            </Box>
          </BlockStack>
        </Box>

        <Divider/>

        <div style={{
          // height: hasPagination ? 'calc(100% - 110px' : 'calc(100% - 50px',
          overflow:'auto',
        }}>

          {/* { isResourceLoading && (<SkeletonResources />) } */}

          {(fetchedTotal < 1) && (
            <EmptyState
              heading="No translations found."
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Please try new search.</p>
            </EmptyState>
          )}

          {Object.keys(resources).map((key, index) => {
            const parentItem = resources[key].info;
            return (
              <div key={'search-section-' + parentItem.id + '-' + (parentItem.item ?? '')} className='item-blocks'>
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
        
        <Box padding='400' borderBlockStartWidth={hasPagination ? '0165' : '0'} borderColor='border'>
          {hasPagination && (
            <Box>
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
        </Box>
      
    </div>
  );
}
