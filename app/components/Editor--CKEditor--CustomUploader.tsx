import { Suspense, useState, useEffect, useRef, useMemo } from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  SourceEditing, 
  Alignment,
  AutoImage,
  Autosave,
  BlockQuote,
  Bold,
  CloudServices,
  Essentials,
  Heading,
  FileRepository,
  ImageBlock,
  ImageCaption,
  ImageInline,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TodoList,
  Underline
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import '../res/ckeditor.css'

/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDM1NTE5OTksImp0aSI6IjBlZmEwMzI3LWQ3NzctNGQ5Yy1hZjMzLTE4YWE3NThjMjA5ZiIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImY3ZjhiYTQ3In0.Ru3FfXNEzUo9nHZsGdpnx_o-NVfTsloeGSsziRsx9vxK0jDU6P7qPYDuM6mdNGFfLTGWcUqV1nQ2BL0EbyGk4g'; // or <YOUR_LICENSE_KEY>.

interface EditorProps {
  text?: string,
  onChange?: Function,
  readOnly?: boolean,
}
const defaultProps : EditorProps = {
  text: '',
  readOnly: false,
  onChange: (data:any) => {},
}



class MyUploadAdapter {
	constructor( loader ) {
		// The file loader instance to use during the upload.
		this.loader = loader;
	}

	// Starts the upload process.
	upload() {
		return this.loader.file
			.then( file => new Promise( ( resolve, reject ) => {
				this._initRequest();
				this._initListeners( resolve, reject, file );
				this._sendRequest( file );
			} ) );
	}

	// Aborts the upload process.
	abort() {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	// Initializes the XMLHttpRequest object using the URL passed to the constructor.
	_initRequest() {
		const xhr = this.xhr = new XMLHttpRequest();

		// Note that your request may look different. It is up to you and your editor
		// integration to choose the right communication channel. This example uses
		// a POST request with JSON as a data structure but your configuration
		// could be different.
		xhr.open( 'POST', 'http://example.com/image/upload/path', true );
		xhr.responseType = 'json';
	}

	// Initializes XMLHttpRequest listeners.
	_initListeners( resolve, reject, file ) {
		const xhr = this.xhr;
		const loader = this.loader;
		const genericErrorText = `Couldn't upload file: ${ file.name }.`;

		xhr.addEventListener( 'error', () => reject( genericErrorText ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'load', () => {
			const response = xhr.response;

			// This example assumes the XHR server's "response" object will come with
			// an "error" which has its own "message" that can be passed to reject()
			// in the upload promise.
			//
			// Your integration may handle upload errors in a different way so make sure
			// it is done properly. The reject() function must be called when the upload fails.
			if ( !response || response.error ) {
				return reject( response && response.error ? response.error.message : genericErrorText );
			}

			// If the upload is successful, resolve the upload promise with an object containing
			// at least the "default" URL, pointing to the image on the server.
			// This URL will be used to display the image in the content. Learn more in the
			// UploadAdapter#upload documentation.
			resolve( {
				default: response.url
			} );
		} );

		// Upload progress when it is supported. The file loader has the #uploadTotal and #uploaded
		// properties which are used e.g. to display the upload progress bar in the editor
		// user interface.
		if ( xhr.upload ) {
			xhr.upload.addEventListener( 'progress', evt => {
				if ( evt.lengthComputable ) {
					loader.uploadTotal = evt.total;
					loader.uploaded = evt.loaded;
				}
			} );
		}
	}

	// Prepares the data and sends the request.
	_sendRequest( file ) {
		// Prepare the form data.
		const data = new FormData();

		data.append( 'upload', file );

		// Important note: This is the right place to implement security mechanisms
		// like authentication and CSRF protection. For instance, you can use
		// XMLHttpRequest.setRequestHeader() to set the request headers containing
		// the CSRF token generated earlier by your application.

		// Send the request.
		this.xhr.send( data );
	}
}

function MyCustomUploadAdapterPlugin( editor ) {
	editor.plugins.get( 'FileRepository' ).createUploadAdapter = ( loader ) => {
		// Configure the URL to the upload script in your back-end here!
    console.log(loader);
		return new MyUploadAdapter( loader );
	};
}


export const TextEditor = (props: EditorProps) => {
  props = {...defaultProps, ...props};
  const { text, onChange, readOnly } = props;

  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    setIsLayoutReady(true);

    return () => setIsLayoutReady(false);
  }, []);

  const { editorConfig } = useMemo(() => {
    if (!isLayoutReady) {
      return {};
    }

    return {
      editorConfig: {
        isReadOnly: {readOnly},
        toolbar: {
          items: [
            'sourceEditing',
            '|',
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            '|',
            'alignment',
            '|',
            'link',
            'insertImage',
            'mediaEmbed',
            '|',
            'bulletedList',
            'outdent',
            'indent',
          ],
          shouldNotGroupWhenFull: false
        },
        plugins: [
          FileRepository,
          MyCustomUploadAdapterPlugin,
          SourceEditing, 
          AutoImage,
          Autosave,
          Alignment,
          BlockQuote,
          Bold,
          CloudServices,
          Essentials,
          Heading,
          Image,
          ImageBlock,
          ImageCaption,
          ImageInline,
          ImageInsertViaUrl,
          ImageResize,
          ImageStyle,
          ImageTextAlternative,
          ImageToolbar,
          ImageUpload,
          Indent,
          IndentBlock,
          Italic,
          Link,
          LinkImage,
          List,
          ListProperties,
          MediaEmbed,
          Paragraph,
          PasteFromOffice,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableProperties,
          TableToolbar,
          TodoList,
          Underline
        ],
        heading: {
          options: [
            {
              model: 'paragraph',
              title: 'Paragraph',
              class: 'ck-heading_paragraph'
            },
            {
              model: 'heading1',
              view: 'h1',
              title: 'Heading 1',
              class: 'ck-heading_heading1'
            },
            {
              model: 'heading2',
              view: 'h2',
              title: 'Heading 2',
              class: 'ck-heading_heading2'
            },
            {
              model: 'heading3',
              view: 'h3',
              title: 'Heading 3',
              class: 'ck-heading_heading3'
            },
            {
              model: 'heading4',
              view: 'h4',
              title: 'Heading 4',
              class: 'ck-heading_heading4'
            },
            {
              model: 'heading5',
              view: 'h5',
              title: 'Heading 5',
              class: 'ck-heading_heading5'
            },
            {
              model: 'heading6',
              view: 'h6',
              title: 'Heading 6',
              class: 'ck-heading_heading6'
            }
          ]
        },
        image: {
          toolbar: [
            'toggleImageCaption',
            'imageTextAlternative',
            '|',
            'imageStyle:inline',
            'imageStyle:wrapText',
            'imageStyle:breakText',
            '|',
            'resizeImage'
          ]
        },
        initialData: text,
        licenseKey: LICENSE_KEY,
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: 'https://',
          decorators: {
            toggleDownloadable: {
              mode: 'manual',
              label: 'Downloadable',
              attributes: {
                download: 'file'
              }
            }
          }
        },
        list: {
          properties: {
            styles: true,
            startIndex: true,
            reversed: true
          }
        },
        placeholder: 'Type or paste your content here!',
        table: {
          contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        }
      }
    };
  }, [isLayoutReady]);

  return (
    <div className="editor-container">
      {editorConfig && (
        <Suspense fallback={"<div>Loading</div>"}>
          <CKEditor 
            editor={ClassicEditor} 
            config={editorConfig} 
            onChange={onChange}
          />
        </Suspense>
      )}
    </div>
  );
}
