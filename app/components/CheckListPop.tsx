import {useState, useCallback, ReactNode} from 'react';
import {
  Text,
  Button,
  BlockStack,
  ActionList,
  Popover,
  OptionList,
  InlineStack,
} from "@shopify/polaris";

import { OptionDescriptor } from '@shopify/polaris/build/ts/src/types';

interface CheckListPopProps {
    label: string|ReactNode,
    options: OptionDescriptor[],
    checked?: string[],
    suffix?: ReactNode,
    onChange: Function,
    multiple?: boolean,
}

export const CheckListPop = ({label, options, checked, multiple, onChange, suffix} : CheckListPopProps ) => {

    const [popActive, setPopActive] = useState(false);
    const [selected, setSelected] = useState<string[]>(checked ? checked : []);

    const togglePopActive = useCallback(() => {
        setPopActive((active) => !active);
        document.body.classList.toggle('resource-panel--open', !popActive);
    }, [popActive]);
    const popActiveActivator = (
        <BlockStack gap="200">
            <a onClick={togglePopActive}>
                {(typeof label == 'string') ? (
                    <InlineStack wrap={false} gap='050'>
                        <span style={{whiteSpace:"nowrap"}}>{label}</span>
                        {suffix}
                    </InlineStack>
                ) : (
                    <InlineStack>
                        {label}
                    </InlineStack>
                )}
            </a>
        </BlockStack>
    );
    
    return (
        <Popover
            active={popActive}
            activator={popActiveActivator}
            autofocusTarget="first-node"
            onClose={togglePopActive}
            >
            <OptionList
                onChange={(selected: string[]) => {setSelected(selected); setPopActive(false); onChange(selected)}}
                options={options}
                selected={selected}
                allowMultiple = {multiple}
            />
        </Popover>
    )
}