const JsdomEnvironment = require("jest-environment-jsdom").default;

class CustomJsdomEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();
    this.global.Request = globalThis.Request;
    this.global.Response = globalThis.Response;
    this.global.Headers = globalThis.Headers;
  }
}

module.exports = CustomJsdomEnvironment;
