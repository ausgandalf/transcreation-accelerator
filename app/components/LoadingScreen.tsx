import {Spinner} from '@shopify/polaris';

export const LoadingScreen = ({position}) => {
  return(
    <div className='loadingScreen' style={{
      position: position ? position : 'fixed',
      left: '0',
      right: '0',
      top: '0',
      bottom: '0',
      backgroundColor: 'rgba(255,255,255,0.8)',
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
