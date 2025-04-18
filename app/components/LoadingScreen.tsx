import {Spinner} from '@shopify/polaris';

interface LoadingScreenProps {
  position?: string,
  opacity?: string,
}

const defaultProps: LoadingScreenProps = {
  position: 'fixed',
  opacity: '0.8',
}

export const LoadingScreen = (props: LoadingScreenProps) => {
  props = {...defaultProps, ...props}
  const { position, opacity } = props;

  return(
    <div className='loadingScreen' style={{
      position,
      left: '0',
      right: '0',
      top: '0',
      bottom: '0',
      backgroundColor: `rgba(255,255,255,${opacity})`,
      zIndex: '1000',
    }}>
      <div className='loadingScreenInner' style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <Spinner accessibilityLabel="Loading" size="large" />
      </div>
    </div>
  )
}
