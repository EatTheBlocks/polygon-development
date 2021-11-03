import { hexlify } from "@ethersproject/bytes";
import { parseUnits } from "@ethersproject/units";
import { notification } from "antd";
import { BLOCKNATIVE_DAPPID, } from "../constants";

import Notify from "bnc-notify";

export default function Transactor(provider, gasPrice, polygonscan) {
  if (typeof provider !== "undefined") {
    // eslint-disable-next-line consistent-return
    return async tx => {
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      console.log("network", network);
      const options = {
        dappId: BLOCKNATIVE_DAPPID, // GET YOUR OWN KEY AT https://account.blocknative.com
        system: "polygon",
        networkId: network.chainId,
        // darkMode: Boolean, // (default: false)
        transactionHandler: txInformation => {
          console.log("HANDLE TX", txInformation);
        },
      };
      const notify = Notify(options);

      let polygonscanNetwork = "";
      if (network.name && network.chainId > 1) {
        polygonscanNetwork = network.name + ".";
      }

      let polygonscanTxUrl = "https://" + polygonscanNetwork + "polygonscan.io/tx/";
      if (network.chainId === 100) {
        polygonscanTxUrl = "https://blockscout.com/poa/xdai/tx/";
      }

      try {
        let result;
        if (tx instanceof Promise) {
          console.log("AWAITING TX", tx);
          result = await tx;
        } else {
          if (!tx.gasPrice) {
            tx.gasPrice = gasPrice || parseUnits("4.1", "gwei");
          }
          if (!tx.gasLimit) {
            tx.gasLimit = hexlify(120000);
          }
          console.log("RUNNING TX", tx);
          result = await signer.sendTransaction(tx);
        }
        console.log("RESULT:", result);
        // console.log("Notify", notify);

        // if it is a valid Notify.js network, use that, if not, just send a default notification
        if ([1, 3, 4, 5, 42, 100].indexOf(network.chainId) >= 0) {
          const { emitter } = notify.hash(result.hash);
          emitter.on("all", transaction => {
            return {
              onclick: () => window.open((polygonscan || polygonscanTxUrl) + transaction.hash),
            };
          });
        } else {
          notification.info({
            message: "Local Transaction Sent",
            description: result.hash,
            placement: "bottomRight",
          });
        }

        return result;
      } catch (e) {
        console.log(e);
        console.log("Transaction Error:", e.message);
        notification.error({
          message: "Transaction Error",
          description: e.message,
        });
      }
    };
  }
}
