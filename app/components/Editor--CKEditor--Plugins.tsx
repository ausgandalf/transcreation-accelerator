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

          button.set({
              label: 'Insert Store Image ',
              withText: false,
              icon: ' <svg viewBox="0 0 20 20"><path d="M1.201 1c-.662 0-1.2.47-1.2 1.1v14.248c0 .64.533 1.152 1.185 1.152h6.623v-7.236L6.617 9.15a.694.694 0 0 0-.957-.033L1.602 13.55V2.553l14.798.003V9.7H18V2.1c0-.63-.547-1.1-1.2-1.1H1.202Zm11.723 2.805a2.094 2.094 0 0 0-1.621.832 2.127 2.127 0 0 0 1.136 3.357 2.13 2.13 0 0 0 2.611-1.506 2.133 2.133 0 0 0-.76-2.244 2.13 2.13 0 0 0-1.366-.44Z"></path><path clip-rule="evenodd" d="M19.898 12.369v6.187a.844.844 0 0 1-.844.844h-8.719a.844.844 0 0 1-.843-.844v-7.312a.844.844 0 0 1 .843-.844h2.531a.843.843 0 0 1 .597.248l.838.852h4.75c.223 0 .441.114.6.272a.844.844 0 0 1 .247.597Zm-1.52.654-4.377.02-1.1-1.143H11v6h7.4l-.023-4.877Z"></path></svg> ',
              tooltip: true,
          });

          // Execute a callback function when the button is clicked.
          button.on( 'execute', () => {
            const imageUrl = prompt("Enter image URL:", "https://via.placeholder.com/150"); // Get URL
            
            // Change the model using the model writer.
            editor.model.change( writer => {
                // Insert the text at the user's current position.
                if (imageUrl) {
                  const imageElement = writer.createElement('imageBlock', {
                      src: imageUrl
                  });
                  editor.model.insertContent(imageElement, editor.model.document.selection);
                }
            });
          });

          return button;
      } );
  }
}
