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

interface SelectPopProps {
    label: string,
    items?: ActionListItemDescriptor[],
    sections?: ActionListSection[],
    suffix?: ReactNode,
    variant?: string
}

const defaultProps: SelectPopProps = {
    label: 'Select',
    variant: 'headingLg',
    suffix: <Icon source={ChevronDownIcon}/>,
}

export const SelectPop = (props : SelectPopProps ) => {
    props = {...defaultProps, ...props};
    const {label, variant, items, sections, suffix} = props;

    const [popActive, setPopActive] = useState(false);

    const togglePopActive = useCallback(() => setPopActive((active) => !active), []);
    const popActiveActivator = (
        <BlockStack gap="200">
            <Button variant='tertiary' onClick={togglePopActive}>
                <InlineStack wrap={false} gap='050'>
                    <Text as='p' variant={ variant }><span style={{whiteSpace:"nowrap"}}>{label}</span></Text>
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
                {items && (
                    <ActionList
                        actionRole="menuitem"
                        items={items}
                    />
                )}

                {sections && (
                    <ActionList
                        actionRole="menuitem"
                        sections={sections}
                    />
                )}

        </Popover>
    )
}