import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';


// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

import FroalaEditor from 'react-froala-wysiwyg';

interface EditorProps {
  text?: string,
  onChange?: Function,
}
const defaultProps : EditorProps = {
  text: '',
  onChange: () => {},
}

export const Editor = (props: EditorProps) => {
  
  props = {...defaultProps, ...props};

  const { text, onChange } = props;

  const [model, setModel] = useState(text);
  const handleModelChange= (event:any)=>{
    console.log(event);
    setModel(event);
    onChange(event);
  }

  return (
    <FroalaEditor 
      tag='textarea' 
      model={model}
      onModelChange={handleModelChange}
      config={{
        pluginsEnabled: ['align', 'link'],
        events: {
          initialized: function (e) {
            var editor = this;
            console.log('@@@@@@initialized', editor, e);
          }
        }
      }} />
  )
}