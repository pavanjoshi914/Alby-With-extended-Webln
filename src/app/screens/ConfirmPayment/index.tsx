import { Transition } from "@headlessui/react";
import { parsePaymentRequest } from "invoices";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import msg from "../../../common/lib/msg";
import utils from "../../../common/lib/utils";
import getOriginData from "../../../extension/content-script/originData";
import type { OriginData } from "../../../types";
import Button from "../../components/Button";
import Checkbox from "../../components/Form/Checkbox";
import PaymentSummary from "../../components/PaymentSummary";
import PublisherCard from "../../components/PublisherCard";
import { useAuth } from "../../context/AuthContext";
import TextField from "../../components/Form/TextField";

export type Props = {
  origin?: OriginData;
  paymentRequest?: string;
  metadata?: string;
};

// props contains one object which contains another two objects origin and paymentRequest. paymentRequest holds lnbc bolt 11 invoice
// and origin holds site name, image, description etc 
// we have already passed an metadata through the SendPayment function of the weblnprovider
// so we need to add metadata in the props of the confirmPayment to render it

//this prompt is shown only for webln based thing
// when payment is done via lnurl qrcode we get prompt rendered present in screens/LNURLPay.tsx
// so currently we are adding metadata only for webln and not for any other thing
function ConfirmPayment(props: Props) {
  console.log(props);

  // converting props.metadata which holds json array into simple array
  // no need for this , just pass props.details json array as it is and then run formattedMetadata function on that array. 
  const metadata = JSON.parse(props.metadata!);

    // this function is called to parese the metadata to convert it into array
  // this function only extracts description and full description if present and returns it in metadata const
  // so like this we can parse received json array using json.parse and convert it into normal array, and then create a new function to extract values from that array
  

  console.log(metadata);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  // holds all the data related to invoice
  // props.paymentRequest holds the original lnurl.

  console.log(props.paymentRequest);
  const invoiceRef = useRef(
    parsePaymentRequest({
      request:
        props.paymentRequest || (searchParams.get("paymentRequest") as string),
    })
  );
  //console.log(invoiceRef);
  
  // holds all the metadata related to site, name of site, icon of site etc
  const originRef = useRef(props.origin || getOriginData());
  // holds origin metadata as well as metadata passed via the webln
  console.log(originRef.current);

  const metadataRef = useRef(props.metadata)

  const paymentRequestRef = useRef(
    props.paymentRequest || searchParams.get("paymentRequest")
  );
  const [budget, setBudget] = useState(
    ((invoiceRef.current?.tokens || 0) * 10).toString()
  );
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [succesMessage, setSuccessMessage] = useState("");

  async function confirm() {
    if (rememberMe && budget) {
      await saveBudget();
    }

    try {
      setLoading(true);
      const response = await utils.call(
        "sendPayment",
        { paymentRequest: paymentRequestRef.current },
        // adding metadata in the object which hold sites metadata as well
        { origin: originRef.current, metadata: metadataRef.current }
        
      );
     
      auth.fetchAccountInfo(); // Update balance.
      msg.reply(response);
      setSuccessMessage("Success, payment sent!");
    } catch (e) {
      console.error(e);
      if (e instanceof Error) alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function reject(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (props.paymentRequest && props.origin) {
      msg.error("User rejected");
    } else {
      navigate(-1);
    }
  }

  function saveBudget() {
    if (!budget) return;
    return msg.request("addAllowance", {
      totalBudget: parseInt(budget),
      host: originRef.current.host,
      name: originRef.current.name,
      imageURL: originRef.current.icon,
    });
  }

  function renderSuccesMessage() {
    return (
      <>
        <dl className="shadow bg-white dark:bg-gray-700 pt-4 px-4 rounded-lg mb-6 overflow-hidden">
          <dt className="text-sm font-semibold text-gray-500">Message</dt>
          <dd className="text-sm mb-4 dark:text-white">{succesMessage}</dd>
        </dl>
        <div className="text-center">
          <button
            className="underline text-sm text-gray-500"
            onClick={() => window.close()}
          >
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <div>
      {/* stores the webln enables sites name and icon and displays it in the confirm payment dialog */}
      <PublisherCard
        title={originRef.current.name}
        image={originRef.current.icon}
      />

      <div className="p-4 max-w-screen-sm mx-auto">
        {!succesMessage ? (
          <>
            <div className="mb-8">
              {/* shows payment summary i.e amount , description and we need to port metadata correctly here */}
              {/* invoiceRef holds bolt 11 invoice, now a days they added new specification guidelines that invoice can contain metadata but no implementation is done in alby i thing to decode metadata from lnbc url 
              https://github.com/lightning/bolts/commit/2ab3a9f0221e601ba58ebb8bcaee55158b21bf80#diff-df5015da6e7bca53db91a45f0908a887b34664093f949400f01148e83ba75b93R713
              so we have to see metadata passed from webln as a side data shall be included in invoice or not.
              i think no. cause lnbc invoice is already send through SendPayment and on side we are sending payment metadata so i think they are not considering to include metadata in invoice
              
              */}
              <PaymentSummary
                amount={invoiceRef.current?.tokens}
                description={invoiceRef.current?.description}
                // we are passing json array directly and then formatting it using GetFormattedJson function  in the PaymentSummary component and rendering it.
                

      
                metadata={props.metadata}
              />
            </div>

            <div className="mb-8">
              <div className="flex items-center">
                <Checkbox
                  id="remember_me"
                  name="remember_me"
                  checked={rememberMe}
                  onChange={(event) => {
                    setRememberMe(event.target.checked);
                  }}
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-900 font-medium dark:text-white"
                >
                  Remember and set a budget
                </label>
              </div>

              <Transition
                show={rememberMe}
                enter="transition duration-100 ease-out"
                enterFrom="scale-95 opacity-0"
                enterTo="scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="scale-100 opacity-100"
                leaveTo="scale-95 opacity-0"
              >
                <p className="mt-4 mb-3 text-gray-500 text-sm">
                  You may set a balance to not be asked for confirmation on
                  payments until it is exhausted.
                </p>
                <div>
                  <TextField
                    id="budget"
                    label="Budget"
                    placeholder="sat"
                    value={budget}
                    type="number"
                    onChange={(event) => setBudget(event.target.value)}
                  />
                </div>
              </Transition>
            </div>

            <div className="text-center">
              <div className="mb-5">
                <Button
                  onClick={confirm}
                  label="Confirm"
                  fullWidth
                  primary
                  disabled={loading}
                  loading={loading}
                />
              </div>

              <p className="mb-3 underline text-sm text-gray-300">
                Only connect with sites you trust.
              </p>

              <a
                className="underline text-sm text-gray-500 dark:text-gray-400"
                href="#"
                onClick={reject}
              >
                Cancel
              </a>
            </div>
          </>
        ) : (
          renderSuccesMessage()
        )}
      </div>
    </div>
  );
}

export default ConfirmPayment;
