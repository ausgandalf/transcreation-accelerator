
export const thStyle = {
  borderTop: '1px solid var(--p-color-border-secondary)',
  padding: 'var(--p-space-300) var(--p-space-300)',
  backgroundColor: 'var(--p-color-input-bg-surface)',
  fontWeight: 'var(--p-font-weight-regular)',
}

export const cellStyle = {
  borderTop: '1px solid var(--p-color-border-secondary)',
  padding: 'var(--p-space-300) var(--p-space-300)',
  fontWeight: 'var(--p-font-weight-regular)',
  verticalAlign: 'top',
}

export const sourceCellStyle = {
  backgroundColor: 'var(--p-color-bg-surface-secondary)',
  borderLeft: '1px solid var(--p-color-border-secondary)',
  borderRight: '1px solid var(--p-color-border-secondary)',
}

export const xtraCellStyle = (type:string) => {
  if (type == 'HTML') {
    return {
      padding: '0',
    }
  }
}

export const targetCellStyle = {
  padding: '0',
  position: 'relative',
}

export const textareaStyle = {
  resize: 'none',
  width: '100%',
  height: '100%',
  padding: 'var(--p-space-300) var(--p-space-300)',
  position: 'absolute',
}
