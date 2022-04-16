import React from 'react';
import './PaymentSummary.css';
type Props = {
  amount: string | React.ReactNode;
  amountAlt?: string;
  description?: string | React.ReactNode;
  metadata?: string;
};



function PaymentSummary({ amount, amountAlt, description, metadata }: Props) {

  function formattedMetadata(
    metadataJSON: string
  ): [string, string | React.ReactNode][] {
    try {
      // if json array passed, formats that json array into simple array and returns the metadata which can be rendered on screen effectively
      const metadata = JSON.parse(metadataJSON);
     // console.log(metadata);

      return metadata
        .map(([type, content]: [string, string]) => {
            
            return [type, content];
         
          
        })
        .filter(Boolean);
    } catch (e) {
      console.error(e);
    }
    return [];
  }


  const metadataRender =formattedMetadata(metadata!).map(([dt, dd]) => {
    
    if(dt === "image"){
    const imageUrl = `data:image/jpeg;base64,${dd}`
    return <>
      <dt>{dt}</dt>
      <dd><div className="details-img"><img src={imageUrl}/></div></dd>
     
    </>
    }
    else
    return <>
    <dt>{dt}</dt>
    <dd>{dd}</dd>
   
  </>
  })

  return (
    <div className="p-4 shadow bg-white border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
      <dl className="mb-0">
        <dt className="uppercase font-semibold text-gray-500 text-xs">
          Amount
        </dt>
        <dd className="mb-0 dark:text-white">{amount}</dd>
        {amountAlt && <dd className="text-gray-500">{amountAlt}</dd>}
        <dt className="mt-4 uppercase font-semibold text-gray-500 text-xs">
          Description
        </dt>
        <dd className="mb-0 dark:text-white">{description}</dd>
        <dt className="mt-4 uppercase font-semibold text-gray-500 text-xs">
          Metadata
        </dt>
          {metadataRender}

          {console.log(metadata)}
      
        
      </dl>
    </div>
  );
}

export default PaymentSummary;
