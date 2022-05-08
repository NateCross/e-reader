// https://github.com/dcode-youtube/single-page-app-vanilla-js/blob/master/frontend/static/js/views/AbstractView.js
export default class {
    constructor(params) {
        this.params = params;
    }

    setTitle(title) {
        document.title = title;
    }

    async getHtml() {
        return "";
    }
}