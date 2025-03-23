import {Spinner} from '@shopify/polaris';

interface LoadingGrayGradientProps {
  height?: string,
}

const defaultProps: LoadingGrayGradientProps = {
  height: '60px',
}

export const LoadingGrayGradient = (props: LoadingGrayGradientProps) => {
  
  props = {...defaultProps, ...props}
  const { height } = props;

  return(
    <div className='loading--gray-gradient' style={{
      height
    }}></div>
  )
}
