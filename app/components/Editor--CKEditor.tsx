import { Suspense, useState, useEffect, useRef, useMemo } from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  SourceEditing, 
  Alignment,
  AutoImage,
  Autosave,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  CloudServices,
  Essentials,
  Heading,
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

import { InsertShopifyImage } from './Editor--CKEditor--Plugins';

/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzY0NzAzOTksImp0aSI6IjBjMmMzNmEzLWQzY2QtNGQyNC05YTFhLTY3YWRkNTQ4MDhkYyIsImxpY2Vuc2VkSG9zdHMiOlsiY2Etc2hvcGlmeS10cmFuc2NyZWF0aW9uLXBvYy5saXZlbHl3YXZlLWIzMzZkYTAyLm5vcnRoZXVyb3BlLmF6dXJlY29udGFpbmVyYXBwcy5pbyJdLCJ1c2FnZUVuZHBvaW50IjoiaHR0cHM6Ly9wcm94eS1ldmVudC5ja2VkaXRvci5jb20iLCJkaXN0cmlidXRpb25DaGFubmVsIjpbImNsb3VkIiwiZHJ1cGFsIl0sImZlYXR1cmVzIjpbIkRSVVAiXSwidmMiOiJiYzI1ZGZmYyJ9.fiiw0Ox9cSHi6tyiUogDqcVIa7Hwpnu_nIS8lIZwjOfM6SGJFdCFF7gZ8Ks_hxGhX1N-RHJXajHLsQ_iX8c3Ew';

interface EditorProps {
  text?: string,
  onChange?: Function,
  onReady?: Function,
  readOnly?: boolean,
}
const defaultProps : EditorProps = {
  text: '',
  readOnly: false,
  onChange: (data:any) => {},
  onReady: (editor:any) => {},
}

export const TextEditor = (props: EditorProps) => {
  props = {...defaultProps, ...props};
  const { text, onReady, onChange, readOnly } = props;

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
            'insertShopifyImage', 'insertImageViaUrl',
            // 'insertImage',
            'mediaEmbed',
            '|',
            'bulletedList',
            'outdent',
            'indent',
          ],
          shouldNotGroupWhenFull: false
        },
        plugins: [
          InsertShopifyImage,
          SourceEditing, 
          AutoImage,
          Autosave,
          Alignment,
          Base64UploadAdapter,
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
            onReady={ editor => {
              // console.log( 'Editor is ready to use!', editor );
              // Custom command can be added up
              onReady(editor);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
