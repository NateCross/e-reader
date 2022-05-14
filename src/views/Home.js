import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Home");
    }

    async getHtml() {
        return `
          <h1>READ ANY EPUB FOR FREE</h1>
          <p>Upload any EPUB file you have on hand by pressing the button or dragging the file to the button below. <br>Happy reading!</p>
          <div class="file-upload-container">
            <label for="file-upload"></label>
            <input
              type   = "file"
              id     = "file-upload"
              name   = "file-upload"
              accept = ".epub"
            >
          </div>
        `;
    }
}
