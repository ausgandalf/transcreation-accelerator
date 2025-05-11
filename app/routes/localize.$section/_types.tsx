export interface ResourcePanelProps {
  selected?: any,
  section?: string,
  visible: boolean,
  onSelect: Function,
  onInject?: Function,
  setLoading?: Function,
  market?: any,
  locale?: any,
  theme?: any,
}

export const defaultResourcePanelProps: ResourcePanelProps = {
  selected: false,
  visible: true,
  section: 'product',
  onSelect: () => {},
  onInject: () => {},
  setLoading: () => {},
  market: {},
  locale: {},
  theme: {},
}

export interface TransReadDataType {
  resourceId: string,
  translatableContent: {
    key: string,
    value: string,
    digest: string,
    locale: string,
    type: string
  }[],
  translations: {
    key: string,
    value: string,
    updatedAt: string
  }[],
}

export interface TransReadResponseType {
  action: string,
  idTypes: {},
  input: {}
  resource: {},
  transdata: TransReadDataType[],
}