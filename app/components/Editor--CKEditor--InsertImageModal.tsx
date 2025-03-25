import {
  ActionList, 
  Thumbnail, 
  Icon, 
  Avatar,
  Box,
  InlineCode,
  InlineStack,
  Text,
  BlockStack,
  Divider,
  Button,
  SkeletonDisplayText,
  SkeletonBodyText,
  Grid,
  Pagination,
  TextField,
  Select,
  Tooltip,
  Spinner,
  DropZone,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  ImageIcon
} from '@shopify/polaris-icons';

import {Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';
import { useFetcher } from "@remix-run/react";

import { useCallback, useEffect, useState } from 'react';

import { LoadingScreen } from './LoadingScreen';
import { addSuffixToFilename, fileToBase64 } from './Functions';

interface InsertImageModalProps {
  editor: any,
}

const defaultProps: InsertImageModalProps = {
  editor: null
}

export const InsertImageModal = (props: InsertImageModalProps) => {

  props = {...defaultProps, ...props}
  const { editor } = props;

  const fetcher = useFetcher();


  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [insertSize, setInsertSize] = useState('');
  const [altText, setAltText] = useState('');

  const [cursor, setCursor] = useState(''); // if empty, means reached to the first.
  const [prevCursor, setPrevCursor] = useState(''); // if empty, means reached to the first.
  const [nextCursor, setNextCursor] = useState(''); // if empty, means reached to the end.
  const [imageList, setImageList] = useState([]); // if empty, means reached to the end.

  const hasNext = (nextCursor != '');
  const hasPrev = (prevCursor != '');

  const initSelection = () => {
    setSelectedImage(null);
    setAltText('');
    setInsertSize('');
  }

  const loadImages = (cursor:string = '', isNext:number = 1) => {
    setIsLoading(true);
    initSelection();
    setCursor(cursor);
    const data = {
      cursor: cursor,
      perPage: 12,
      action: 'file_list',
      isNext,
    };
    fetcher.submit(data, { action:"/api", method: "post" });
  }

  const loadImage = (id:string) => {
    const data = {
      id,
      action: 'get_image_url',
    };
    fetcher.submit(data, { action:"/api", method: "post" });
  }

  const getUploadEndPoint = (file:File) => {
    setIsLoading(true);

    const data = {
      filename: file.name,
      filesize: file.size,
      type: file.type,
      action: 'image_upload_url',
    };

    const formData = new FormData();
    for (let key in data) {
      formData.append(key, data[key]);  
    }

    // formData.append('file', file);
    // fetcher.submit(formData, { action:"/api", method: "post", encType: "multipart/form-data" });
    fetcher.submit(formData, { action:"/api", method: "post"});
  }

  const gotoPrevPage = useCallback(() => {
    loadImages(prevCursor, 0);
  }, [prevCursor]);

  const gotoNextPage = useCallback(() => {
    loadImages(nextCursor);
  }, [nextCursor]);

  useEffect(() => {
    if (cursor == '') {
      loadImages();
    }
  }, [cursor]);

  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
      // TODO
    } else {
      if (fetcher.data.action == 'file_list') { 
        const resData = fetcher.data.files;
        if (resData.pageInfo) {
          setPrevCursor(resData.pageInfo.hasPreviousPage ? resData.pageInfo.startCursor : "");
          setNextCursor(resData.pageInfo.hasNextPage ? resData.pageInfo.endCursor : "");
        }

        if (resData.nodes) {
          const images = resData.nodes.map((x, i) => {
            if (x.fileStatus != 'READY') {
              loadImage(x.id);
            }
            return {id:x.id, url:x.preview.image ? x.preview.image.url : ''}
          });
          setImageList(images);
        }

        setIsLoading(false);

      } else if (fetcher.data.action == 'image_upload_url') {
        const {url, resourceUrl, parameters} = fetcher.data.endpoint.target;
        
        const formData = new FormData();
        parameters.map((x, i) => {
          formData.append(x.name, x.value);
        });
        formData.append('file', imageFile);

        const response = fetch(url, {
          method: 'POST',
          body: formData,
        })
        .then((response) => {
          if (response.ok) {
            //
            fetcher.submit({
              url: resourceUrl,
              action: 'create_image'
            }, { action:"/api", method: "post" });
          } else {
            // Error
            setIsLoading(false);
            throw new Error('Network response was not ok');
          }
        });
        
      } else if (fetcher.data.action == 'create_image') {
        // Reload
        loadImages();
      } else if (fetcher.data.action == 'get_image_url') {
        //
        const {id, url} = fetcher.data;
        const newImageList = imageList.map((x, i) => {
          if (x.id == id) {
            return {...x, url};
          } else {
            return {...x};
          }
        })
        setImageList(newImageList);
      }
    }
  }, [fetcher.data]);


  const sizeOptions = [
    {label: 'Original', value: ''},
    {label: 'Inline (16px)', value: '16x16'},
    {label: 'Icon (32x32)', value: '32x32'},
    {label: 'Thumb (50x50)', value: '50x50'},
    {label: 'Small logo (100px)', value: '100x100'},
    {label: 'Logo (160px)', value: '160x160'},
    {label: 'Thumbnail (240px)', value: '240x240'},
    {label: 'Product image (480px)', value: '480x480'},
    {label: 'Banner image (600px)', value: '600x600'},
    {label: 'Wallpaper (1024px)', value: '1024x1024'},
    {label: 'Wallpaper (2048px)', value: '2048x2048'},
  ];


  const [imageFile, setImageFile] = useState<File>();
  const [imageFileBlob, setImageFileBlob] = useState<Blob>();
  const [imageBase64, setImageBase64] = useState<string>();
  const [openFileDialog, setOpenFileDialog] = useState(false);

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/avif', 'image/svg+xml'];
  const handleDropZoneDrop = useCallback(
    async (dropFiles: File[], _acceptedFiles: File[], _rejectedFiles: File[]) => {
      if (_acceptedFiles.length < 1) return;
      const file = _acceptedFiles[0];
      if (!validImageTypes.indexOf(file.type)) return;

      // TODO UPLOAD
      // const base64String:string = await fileToBase64(file);
      // const fileBlob = new Blob([file], { type: file.type });
      
      // setImageFileBlob(fileBlob);
      // setImageBase64(base64String);
      setImageFile(file);
      getUploadEndPoint(file);
    }, []);

  const toggleOpenFileDialog = useCallback(
    () => setOpenFileDialog((openFileDialog) => !openFileDialog),
    [],
  );

  return (
    <Modal id="insert-image-modal" onShow={() => {initSelection()}}>
      <BlockStack gap="0">

        <div style={{display:'none'}}>
          <DropZone
            accept={validImageTypes.join(',')}
            allowMultiple={false}
            openFileDialog={openFileDialog}
            type="image"
            onDrop={handleDropZoneDrop}
            onFileDialogClose={toggleOpenFileDialog}
          >
          </DropZone>
        </div>

        <Box padding="0">
          <div style={{position:'relative', overflow:'hidden'}}>
            <BlockStack>
              <Box padding="400">
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(4, 1fr)',
                  gridGap:'10px',
                  minHeight: '428px',
                  position: 'relative',
                }} onClick={() => setSelectedImage(null)}>
                  {isLoading && (<LoadingScreen position='absolute' />)}
                  {imageList.map((x, i) => (
                    <div key={x.id} style={{
                      fontSize: '0',
                      textAlign: 'center',
                      // transform: (selectedImage?.id == x.id) ? 'scale(0.98)' : 'none',
                      // transition: 'transform .2s linear',
                    }}>
                      <button disabled={x.url == ''} className='insertImageItem' onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        if (selectedImage?.id == x.id) {
                          setSelectedImage(null);
                        } else {
                          setSelectedImage(x);
                        }
                      }} style={{
                        position:'relative',
                        borderColor: (selectedImage?.id == x.id) ? 'var(--p-color-border-focus)' : 'var(--p-color-border)',
                        transition: 'border .2s linear',
                      }}>

                        {(x.url == '') && (
                          <div style={{width:'115px',height:'120px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Spinner accessibilityLabel="Loading preview..." size="small" />
                          </div>
                        )}
                        {(x.url != '') && (
                          <img src={x.url} style={{width:'115px',height:'120px',objectFit:'contain'}} />
                        )}

                        {(selectedImage?.id == x.id) && (
                          <div style={{
                            position: 'absolute',
                            right: '0',
                            top: '0',
                            transform: 'translate(50%, -50%)',
                          }}>
                            <Icon source={CheckCircleIcon} tone='emphasis'/>
                          </div>
                        )}
                        
                      </button>
                    </div>
                  ))}
                </div>
              </Box>

              
              <div  style={{
                position:'absolute', 
                bottom:'0', 
                width:'100%', 
                opacity:'0.95',
                transform: selectedImage ? 'none' : 'translateY(100%)',
                transition: 'transform 0.2s linear',
              }}>
                <Box background='bg-fill-active' paddingBlock="200" paddingInline="400">
                  <BlockStack gap="200">
                    <Grid>
                      <Grid.Cell columnSpan={{xs:6, sm:2, lg:4}}>
                        <Select
                          label="Size"
                          options={sizeOptions}
                          onChange={sizeValue => setInsertSize(sizeValue)}
                          value={insertSize}
                        />
                      </Grid.Cell>
                      <Grid.Cell columnSpan={{xs:6, sm:4, lg:8}}>
                        <BlockStack>
                          <TextField 
                            label='Image alt text' 
                            value={altText}
                            onChange={value => setAltText(value)}
                            autoComplete='off'
                          />
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                    <Text as='p' variant='bodyMd' tone='subdued'>
                      Alt text makes images more accessible to everyone, including people with visual impairments. Learn more about <a href="https://help.shopify.com/en/manual/products/product-media/add-alt-text">alt text</a>.
                    </Text>
                  </BlockStack>
                </Box>
              </div>
              
              
            </BlockStack>
          </div>
        </Box>

        <Box padding="400" background='bg-fill-active' borderBlockStartWidth='025' borderColor='border'>
          <InlineStack align='space-between'>
            <InlineStack align='start' wrap={false}>
              <Pagination
                hasPrevious = {hasPrev}
                onPrevious={gotoPrevPage}
                hasNext = {hasNext}
                onNext={gotoNextPage}
              />
            </InlineStack>

            <InlineStack align='end' wrap={false} gap="100">
              <Button variant='secondary' onClick={() => {
                document.getElementById('insert-image-modal').hide();
              }}>Cancel</Button>
              <Button variant='secondary' onClick={toggleOpenFileDialog}>Upload File</Button>
              <Button disabled={!selectedImage} variant='primary' onClick={() => {
                if (document.currentEditor) {
                  document.currentEditor.model.change( writer => {
                    // Insert the text at the user's current position.
                    let imageUrl = selectedImage.url;
                    if (insertSize != '') {
                      imageUrl = addSuffixToFilename(imageUrl, '_' + insertSize);
                    }
                    if (imageUrl) {
                      const imageElement = writer.createElement('imageBlock', {
                          src: imageUrl,
                          alt: altText
                      });
                      document.currentEditor.model.insertContent(imageElement, document.currentEditor.model.document.selection);
                    }
                  });

                  document.getElementById('insert-image-modal').hide();
                } else {
                  // Something went wrong, no editor found?? then just close it.
                  document.getElementById('insert-image-modal').hide();
                }
              }}>Insert Image</Button>
            </InlineStack>
          
          </InlineStack>
        </Box>
      </BlockStack>
      <TitleBar title='Insert image'></TitleBar>
    </Modal>
  );
}
