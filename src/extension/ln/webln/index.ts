// custom type decleration of some of the arguments
type RequestInvoiceArgs = {
  amount?: string | number;
  defaultAmount?: string | number;
  minimumAmount?: string | number;
  maximumAmount?: string | number;
  defaultMemo?: string;
};

// webln provider class provides webln functionality and its exported so that in any file we can create an instance of the class and use the functionality class is providing.
export default class WebLNProvider {
  enabled: boolean;
  isEnabled: boolean;
  executing: boolean;

  // content of constructor is initilized before the component is loaded
  constructor() {
    // by default we set it to false, this value will be set true once clicked on enable button
    this.enabled = false;
    this.isEnabled = false; // seems some webln implementations use webln.isEnabled and some use webln.enabled
    this.executing = false;
  }
  //function to enable webln.
  // all the function here runs when clicked on qr code
  enable() {
    // if already enabled i.e value declared in constructor this.enabled holds true, return promise is already resolved.
    if (this.enabled) {
      return Promise.resolve({ enabled: true });
    }
    //else execute webln service "enable"
    return this.execute("enable").then((result) => {
      if (typeof result.enabled === "boolean") {
        // if we get boolean value updated values of enabled and isEnabled and return that boolean value
        this.enabled = result.enabled;
        this.isEnabled = result.enabled;
      }
      // if we get something else return that
      return result;
    });
  }

  // to get infor
  getInfo() {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling getInfo");
    }
    return this.execute("getInfo");
  }

  // to get list of translations
  getTransactions() {
    if (!this.enabled) {
      throw new Error(
        "Provider must be enabled before calling getTransactions"
      );
    }
    return this.execute("getTransactions");
  }

  // to get lnurl
  lnurl(lnurlEncoded: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling lnurl");
    }
    return this.execute("lnurl", { lnurlEncoded });
  }

  // to send payment
  sendPayment(paymentRequest: string, metadata: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling sendPayment");
    }
    return this.execute("sendPaymentOrPrompt", { paymentRequest, metadata });
  }

  // to make invoice
  makeInvoice(args: string | number | RequestInvoiceArgs) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling makeInvoice");
    }
    if (typeof args !== "object") {
      args = { amount: args };
    }

    return this.execute("makeInvoice", args);
  }

  // to sign the message
  signMessage(message: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling signMessage");
    }

    return this.execute("signMessageOrPrompt", { message });
  }
  // to verify the message

  verifyMessage(signature: string, message: string) {
    if (!this.enabled) {
      throw new Error("Provider must be enabled before calling verifyMessage");
    }

    return this.execute("verifyMessage", { signature, message });
  }

  // this function is executed in all above functions, all the functionality of weblnprovider handled in this function
  execute(
    // get type of services triggered, eg. enabled, verifyMessage etc
    type: string,
    // extra arguments passed associated with particular service
    args?: Record<string, unknown>
    // this function basically returns a promise, which is either in resolved state or in reject state, for first time user if some webln service is triggerd this will run and will enable that webln service and returns the promise to respective function
    // eg. enable() if already not enabled this will executed webln will be enalbed and promise will be returned, now next time when user visits same site, enable() function will see promise is in resolved state or not
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      // post the request to the content script. from there it gets passed to the background script and back
      // in page script can not directly connect to the background script
      window.postMessage(
        {
          application: "LBE",
          prompt: true,
          //action: `webln/${type}`, // TODO: think about a convention to cal the actions
          type: `${type}`,
          args,
        },
        "*" // TODO use origin
      );

      function handleWindowMessage(messageEvent: MessageEvent) {
        // check if it is a relevant message
        // there are some other events happening
        if (
          !messageEvent.data ||
          !messageEvent.data.response ||
          messageEvent.data.application !== "LBE"
        ) {
          return;
        }
        if (messageEvent.data.data.error) {
          reject(new Error(messageEvent.data.data.error));
        } else {
          // 1. data: the message data
          // 2. data: the data passed as data to the message
          // 3. data: the actual response data
          resolve(messageEvent.data.data.data);
        }
        // For some reason must happen only at the end of this function
        window.removeEventListener("message", handleWindowMessage);
      }

      window.addEventListener("message", handleWindowMessage);
    });
  }
}
