export interface ResourcePanelProps {
  selected?: any,
  section?: string,
  visible: boolean,
  onSelect: Function,
}

export const defaultResourcePanelProps: ResourcePanelProps = {
  selected: false,
  visible: true,
  section: 'product',
  onSelect: () => {}
}