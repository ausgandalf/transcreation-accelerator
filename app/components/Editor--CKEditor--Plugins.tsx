import {
  ButtonView,
  Plugin,
} from 'ckeditor5';

export class InsertShopifyImage extends Plugin {
  init() {
      const editor = this.editor;
      editor.ui.componentFactory.add( 'insertShopifyImage', () => {
          // The button will be an instance of ButtonView.
          const button = new ButtonView();

          const buttonIcon = `<svg viewBox="0 0 20 20"><path d="M1.201 1C.538 1 0 1.47 0 2.1v14.363c0 .64.534 1.037 1.186 1.037h9.494a2.97 2.97 0 0 1-.414-.287 2.998 2.998 0 0 1-1.055-2.03 3.003 3.003 0 0 1 .693-2.185l.383-.455-.02.018-3.65-3.41a.695.695 0 0 0-.957-.034L1.5 13.6V2.5h15v5.535a2.97 2.97 0 0 1 1.412.932l.088.105V2.1c0-.63-.547-1.1-1.2-1.1H1.202Zm11.713 2.803a2.146 2.146 0 0 0-2.049 1.992 2.14 2.14 0 0 0 1.28 2.096 2.13 2.13 0 0 0 2.644-3.11 2.134 2.134 0 0 0-1.875-.978Z"></path><path d="M15.522 19.1a.79.79 0 0 0 .79-.79v-5.373l2.059 2.455a.79.79 0 1 0 1.211-1.015l-3.352-3.995a.79.79 0 0 0-.995-.179.784.784 0 0 0-.299.221l-3.35 3.99a.79.79 0 1 0 1.21 1.017l1.936-2.306v5.185c0 .436.353.79.79.79Z"></path><path d="M15.522 19.1a.79.79 0 0 0 .79-.79v-5.373l2.059 2.455a.79.79 0 1 0 1.211-1.015l-3.352-3.995a.79.79 0 0 0-.995-.179.784.784 0 0 0-.299.221l-3.35 3.99a.79.79 0 1 0 1.21 1.017l1.936-2.306v5.185c0 .436.353.79.79.79Z"></path></svg>`;
          button.set({
              label: 'Insert Image from Store',
              withText: false,
              icon: buttonIcon,
              class: 'insertImageFromStoreButton',
              tooltip: true,

          });

          // Execute a callback function when the button is clicked.
          button.on( 'execute', () => {

            document.currentEditor = editor;
            document.getElementById('insert-image-modal').show();

            // const imageUrl = prompt("Enter image URL:", "https://via.placeholder.com/150"); // Get URL
            
            // Change the model using the model writer.
            /*
            editor.model.change( writer => {
                // Insert the text at the user's current position.
                if (imageUrl) {
                  const imageElement = writer.createElement('imageBlock', {
                      src: imageUrl
                  });
                  editor.model.insertContent(imageElement, editor.model.document.selection);
                }
            });
            */
          });

          return button;
      } );
  }
}
