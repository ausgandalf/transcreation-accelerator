import { useState, useEffect } from 'react';
import { Form } from '@remix-run/react';

// CK5 Rich-Text-Editor Types
import type ChangeEvent from "@ckeditor/ckeditor5-utils/src/eventinfo";
import {Box, SkeletonDisplayText} from '@shopify/polaris';
import { LoadingGrayGradient } from './LoadingGrayGradient';

interface EditorProps {
  text?: string,
  onChange?: Function,
  readOnly?: boolean,
}
const defaultProps : EditorProps = {
  text: '',
  readOnly: false,
  onChange: (data:string) => {},
}


export const Editor = (props: EditorProps) => {
  props = {...defaultProps, ...props};
  const { text, onChange, readOnly } = props;
  const [TextEditorComponent, setTextEditorComponent] = useState<React.ElementType | null>(null);

  useEffect(() => {
    async function loadTextEditor() {
      try {
        // console.log('Attempting to load TextEditor');
        const { TextEditor } = await import('./Editor--CKEditor');
        // console.log('TextEditor loaded:', TextEditor);
        setTextEditorComponent(() => TextEditor);
      } catch (error) {
        console.error('Failed to load TextEditor:', error);
      }
    }
    loadTextEditor();
  }, []);

  return (
    <div style={{width:'100%'}}>

      {!TextEditorComponent && (
        <Box>
          <LoadingGrayGradient height='39px' />
          <Box minHeight='250px' />
        </Box>
      )}
      {TextEditorComponent && (
        <TextEditorComponent 
          text={text} 
          readOnly={readOnly} 
          onChange={(event: ChangeEvent, editor: any) => {
            const data:string = editor.getData();
            // console.log({ event, editor, data });
            onChange(data);

            if (readOnly) {
              // console.log(editor.xtraDatatext);
              if (editor.xtraData && editor.xtraData.isForcedRollback) {
                editor.xtraData.isForcedRollback = false;
                return;
              } 
              // Rollback to initial data
              if (!editor.xtraData) editor.xtraData = {};
              editor.xtraData.isForcedRollback = true;
              editor.setData(text)
            }
          }} 
        />
      )}
    </div>
)

}