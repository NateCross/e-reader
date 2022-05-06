// TODO: Make options. Have this save every time it's changed or something.
export default class Options {
  constructor(options) {
    this.speech = {
      lang: options.speech.lang,
      volume: options.speech.volume,
      rate: options.speech.rate,
      pitch: options.speech.pitch,
    }
    this.fontSize = options.fontSize;
    // this.theme = options.theme;
    this.viewMode = options.viewMode;
  }
}

export const defaultOptions = new Options(
  
);
