import "./styles.css";
import { Seaport } from "@opensea/seaport-js";
import { ethers } from "ethers";
import { useState } from "react";
import { OPENSEA_CONDUIT_KEY } from "@opensea/seaport-js/lib/constants";
import { useEffect } from "react";

function App() {
  const [seaport, setSeaport] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState(1);
  const [currentOfferJson, setCurrentOfferJson] = useState(
    localStorage.getItem("currentOfferJson")
  );
  const [currentConsiderationJson, setCurrentConsiderationJson] = useState(
    localStorage.getItem("currentConsiderationJson")
  );
  const [currentOrder, setCurrentOrder] = useState(
    localStorage.getItem("currentOrder") || ""
  );

  const offererConduitKey = OPENSEA_CONDUIT_KEY;
  const fulFillerConduitKey = OPENSEA_CONDUIT_KEY;
  //conduitKey: "0x0000000000000000000000000000000000000000000000000000000000000000",
  //conduitKey: "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",

  const prepOrder = async () => {
    if (!currentAddress || !currentOfferJson || !currentConsiderationJson) {
      return;
    }
    let offer,
      consideration = {};
    try {
      offer = JSON.parse(currentOfferJson);
      consideration = JSON.parse(currentConsiderationJson);
    } catch (e) {
      console.error(e);
    }
    const { executeAllActions } = await bootstrapSeaport().createOrder(
      {
        conduitKey: offererConduitKey,
        zone: "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
        startTime: "1661790956",
        endTime:
          "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        offer: offer,
        consideration: consideration
      },
      currentAddress
    );
    const order = await executeAllActions();
    setCurrentOrder(JSON.stringify(order, null, 4));
    localStorage.setItem("currentOrder", JSON.stringify(order, null, 4));
  };

  const fulfilOrder = async () => {
    let order = {};
    try {
      order = JSON.parse(currentOrder);
    } catch (e) {
      console.error(e);
    }
    const result = await bootstrapSeaport().fulfillOrder({
      order: order,
      accountAddress: currentAddress,
      conduitKey: fulFillerConduitKey
    });
    console.info("Order result:", result);
    const transaction = result.executeAllActions();
    console.log(transaction);
  };

  const fulfilOrders = async () => {
    let order = {};
    try {
      order = JSON.parse(currentOrder);
    } catch (e) {
      console.error(e);
    }
    const result = await bootstrapSeaport().fulfillOrders({
      fulfillOrderDetails: [{ order: order }],
      accountAddress: currentAddress,
      conduitKey: fulFillerConduitKey
    });
    console.info("Order result:", result);
    const transaction = result.executeAllActions();
    console.log(transaction);
  };

  const matchOrders = async () => {
    let order = {};
    try {
      order = JSON.parse(currentOrder);
    } catch (e) {
      console.error(e);
    }
    const result = await bootstrapSeaport().matchOrders({
      orders: [order],
      fulfillments: [
        {
          offerComponents: [
            {
              orderIndex: 0,
              itemIndex: 0
            }
          ],
          considerationComponents: [
            {
              orderIndex: 1,
              itemIndex: 0
            }
          ]
        }
      ]
    });
    result.buildTransaction({
      gasLimit: 10000000
    });
    console.info("match result:", result);
    result.transact();
  };
  const handleAccountsChanged = (accounts = []) => {
    if (accounts.length > 0) {
      setCurrentAddress(accounts[0]);
    }
  };
  const handleChainChanged = (chainId = "") => {
    if (!isNaN(Number(chainId))) {
      setCurrentChainId(Number(chainId));
      bootstrapSeaport();
    }
  };
  const handleOfferChanged = (event) => {
    setCurrentOfferJson(event?.target?.value);
    localStorage.setItem("currentOfferJson", event?.target?.value);
  };
  const handleConsiderationChanged = (event) => {
    setCurrentConsiderationJson(event?.target?.value);
    localStorage.setItem("currentConsiderationJson", event?.target?.value);
  };
  const handleWholeOfferChanged = (event) => {
    setCurrentOrder(event?.target?.value);
    localStorage.setItem("currentOrder", event?.target?.value);
  };
  const bootstrapSeaport = (chainId) => {
    const usingChainId = chainId ? chainId : currentChainId;
    console.info("bootstrapSeaport: chain ID ", usingChainId);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const _seaport = new Seaport(provider);
    setSeaport(_seaport);
    return _seaport;
  };

  useEffect(() => {
    window?.ethereum?.on("accountsChanged", handleAccountsChanged);
    window?.ethereum?.on("chainChanged", handleChainChanged);
    window?.ethereum
      ?.request({
        method: "eth_requestAccounts"
      })
      .then((accounts) => {
        if (accounts.length > 0) {
          setCurrentAddress(accounts[0]);
          if (!isNaN(Number(window?.ethereum?.chainId))) {
            setCurrentChainId(Number(window?.ethereum?.chainId));
            bootstrapSeaport(Number(window?.ethereum?.chainId));
          }
        }
      });
    return () => {
      window?.ethereum?.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      window?.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);
  return (
    <div className="App">
      <div>
        <div>
          <h3>Seaport Order Creator & Fulfiller</h3>
        </div>
        <div>
          <div>Chain ID: {currentChainId}</div>
          <div>Seaport instance: {String(!!seaport)}</div>
          <div>
            Address: <b>{currentAddress}</b>
          </div>
          <div>
            <button onClick={prepOrder}>Prepare Order</button>
            <button onClick={fulfilOrder}>Fulfil Order</button>
            <button onClick={matchOrders}>Match Orders</button>
            <button onClick={fulfilOrders}>Fulfil Orders</button>
          </div>
          <div>
            <p>Offer: </p>
            <textarea
              rows={8}
              cols={70}
              defaultValue={currentOfferJson}
              onChange={handleOfferChanged}
            ></textarea>
          </div>
          <div>
            <p>consideration: </p>
            <textarea
              rows={8}
              cols={70}
              defaultValue={currentConsiderationJson}
              onChange={handleConsiderationChanged}
            ></textarea>
          </div>
          <p>Order: </p>
          <textarea
            cols={70}
            value={currentOrder}
            className="order-details"
            onChange={handleWholeOfferChanged}
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default App;
