import {useState, useCallback, ReactNode} from 'react';
import {
    Icon,
    Text,
    Button,
    BlockStack,
    Box,
    ActionList,
    Popover,
    OptionList,
    InlineStack,
} from "@shopify/polaris";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@shopify/polaris-icons';

  
import { ActionListItemDescriptor, ActionListSection } from '@shopify/polaris/build/ts/src/types';

interface MarketsPopProps {
    locales?: [],
    markets?: [],
    defaultLocale?: {},
    currentLocale?: {},
    currentMarket?: {},
    suffix?: ReactNode,
    variant?: string,
    update?: Function,
}

const defaultProps: MarketsPopProps = {
    locales: [],
    markets: [],
    defaultLocale: {locale: 'en', name: 'English', primary: true, published: true},
    currentLocale: {locale: 'en', name: 'English', primary: true, published: true},
    currentMarket: {handle: '', name: '', locales: []},
    update: (market: string, locale: string) => {},
    suffix: <Icon source={ChevronDownIcon}/>,
    variant: 'headingLg',
}

export const MarketsPop = (props : MarketsPopProps ) => {

    props = {...defaultProps, ...props}
    const { variant, locales, markets, defaultLocale, currentLocale, currentMarket, suffix, update } = props;

    const [popActive, setPopActive] = useState(false);
    const [ selectedLocale, setSelectedLocale ] = useState(currentLocale);
    const [ selectedMarket, setSelectedMarket ] = useState(currentMarket);
    
    const getLocaleByKey = (locale: string) => {
        let localeObj = {};
        locales?.some((item) => {
            if (locale == item.locale) {
                localeObj = item;
                return true;
            }
        })
        return localeObj;
    };

    let sections:Array<any> = [];
    sections.push({
        title: 'Translate across markets',
        items: 
            locales?.filter((x, i) => (x.locale != defaultLocale.locale))
                .map((x, i) => ({
                    content: x.name,
                    active: (currentMarket.handle == '') && (x.locale == currentLocale.locale),
                    onAction: () => {
                        // setSelectedLocale(x);
                        // setPopActive(false);
                        update('', x.locale);
                    },
                }))
    });

    sections.push({
        title: 'Adapt a market',
        items: markets?.map((x, i) => ({
            content: x.name,
            active: x.handle == currentMarket.handle,
            onAction: () => {
                setSelectedMarket(x);
            },
            suffix: <Icon source={ChevronRightIcon} />,
        }))
    });

    const label = () => {
        if (selectedMarket.handle == '') {
            return `Translating ${currentLocale.name}`;
        } else {
            return `Adapting ${currentLocale.name} for ${currentMarket.name}`;
        }
    }

    const togglePopActive = useCallback(() => {
        setPopActive((active) => !active);
        setSelectedMarket(currentMarket);
    }, []);
    const popActiveActivator = (
        <BlockStack gap="200">
            <Button variant='tertiary' onClick={togglePopActive}>
                <InlineStack wrap={false} gap='050'>
                    <Text as='p' variant={ variant }><span style={{whiteSpace:"nowrap"}}>{label()}</span></Text>
                    {suffix}
                </InlineStack>
            </Button>
        </BlockStack>
    );
    
    return (
        <Popover
            active={popActive}
            activator={popActiveActivator}
            autofocusTarget="first-node"
            onClose={togglePopActive}
            >
                {(selectedMarket.handle != '') && (
                    <BlockStack>
                        <Box padding='200' minWidth='270px'>
                            <InlineStack gap='100'>
                                <Button variant='tertiary' icon={ChevronLeftIcon} accessibilityLabel='Go Back' onClick={() => {
                                    setSelectedMarket(defaultProps.currentMarket);
                                }} />
                                <Text as='p' variant='headingSm' tone='subdued'>Adapt {selectedMarket.name} content</Text>
                            </InlineStack>
                        </Box>
                        <ActionList
                            actionRole="menuitem"
                            items={selectedMarket.locales.map((x, i) => ({
                                content: getLocaleByKey(x.locale).name,
                                active: (currentMarket.handle == selectedMarket.handle) && (x.locale == currentLocale.locale),
                                onAction: () => {
                                    // setSelectedLocale(getLocaleByKey(x.locale));
                                    // setPopActive(false);
                                    update(selectedMarket.handle, x.locale);
                                }
                            }))}
                        />
                    </BlockStack>
                )}

                {(selectedMarket.handle == '') && (
                    <ActionList
                        actionRole="menuitem"
                        sections={sections}
                    />
                )}

        </Popover>
    )
}