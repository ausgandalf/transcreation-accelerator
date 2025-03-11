import {useState, useCallback, ReactNode} from 'react';
import {
    Icon,
    Text,
    Button,
    BlockStack,
    ActionList,
    Popover,
    OptionList,
    InlineStack,
} from "@shopify/polaris";
import {
    ChevronDownIcon,
} from '@shopify/polaris-icons';

  
import { ActionListItemDescriptor, ActionListSection } from '@shopify/polaris/build/ts/src/types';

interface MarketsPopProps {
    locales?: [],
    markets?: [],
    currentLocale?: {},
    currentMarket?: {},
    suffix?: ReactNode,
    variant?: string,
    update?: Function,
}

const defaultProps: MarketsPopProps = {
    locales: [],
    markets: [],
    currentLocale: {locale: 'en', name: 'English', primary: true, published: true},
    currentMarket: {handle: '', name: '', locales: []},
    update: (market: string, locale: string) => {},
    suffix: <Icon source={ChevronDownIcon}/>,
    variant: 'headingLg',
}

export const MarketsPop = (props : MarketsPopProps ) => {

    props = {...defaultProps, ...props}
    const { variant, locales, markets, currentLocale, currentMarket, suffix, update } = props;

    const [popActive, setPopActive] = useState(false);
    const [localesSectionActive, setLocalesSectionActive] = useState(false);
    const [ selectedLocale, setSelectedLocale ] = useState(currentLocale);
    const [ selectedMarket, setSelectedMarket ] = useState(currentMarket);
    

    let sections:Array<any> = [];
    sections.push({
        title: 'Translate across markets',
        items: locales?.map((x, i) => ({
            content: x.name,
            active: x.locale == selectedLocale.locale,
            onAction: () => {
                setSelectedLocale(x);
                setPopActive(false);
                update('', x.locale);
            },
        }))
    });

    sections.push({
        title: 'Adapt a market',
        items: markets?.map((x, i) => ({
            content: x.name,
            active: x.name == selectedMarket,
            onAction: () => {
                setSelectedMarket(x);
                setLocalesSectionActive(true);
            },
        }))
    });

    const label = () => {
        if (selectedMarket.handle == '') {
            return `Translating ${selectedLocale.name}`;
        } else {
            return `Adapting ${selectedLocale.name} for ${selectedMarket.name}`;
        }
    }

    const togglePopActive = useCallback(() => setPopActive((active) => !active), []);
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
                {!localesSectionActive && (
                    <ActionList
                        actionRole="menuitem"
                        sections={sections}
                    />
                )}

        </Popover>
    )
}