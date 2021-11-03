import React, { useState, useCallback } from "react";
import { Input, Button, Tooltip } from "antd";
import Blockies from "react-blockies";
import { SendOutlined } from "@ant-design/icons";
import { parseEther } from "@ethersproject/units";
import { Transactor } from "../helpers";
import Wallet from "./Wallet";
import { useLookupAddress } from "eth-hooks";

export default function Faucet(props) {
  const [address, setAddress] = useState();

  let blockie;
  if (address && typeof address.toLowerCase === "function") {
    blockie = <Blockies seed={address.toLowerCase()} size={8} scale={4} />;
  } else {
    blockie = <div />;
  }

  const ens = useLookupAddress(props.ensProvider, address);

  const updateAddress = useCallback(
    async newValue => {
      if (typeof newValue !== "undefined") {
        let address = newValue;
        if (address.indexOf(".eth") > 0 || address.indexOf(".xyz") > 0) {
          try {
            const possibleAddress = await props.ensProvider.resolveName(address);
            if (possibleAddress) {
              address = possibleAddress;
            }
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
        setAddress(address);
      }
    },
    [props.ensProvider, props.onChange],
  );

  const tx = Transactor(props.localProvider);

  return (
    <span>
      <Input
        size="large"
        placeholder={props.placeholder ? props.placeholder : "local faucet"}
        prefix={blockie}
        //value={address}
        value={ens || address}
        onChange={e => {
          //setAddress(e.target.value);
          updateAddress(e.target.value);
        }}
        suffix={
          <Tooltip title="Faucet: Send local MATIC to an address.">
            <Button
              onClick={() => {
                tx({
                  to: address,
                  value: parseEther("0.01"),
                });
                setAddress("");
              }}
              shape="circle"
              icon={<SendOutlined />}
            />
            <Wallet color="#888888" provider={props.localProvider} ensProvider={props.ensProvider} price={props.price} />
          </Tooltip>
        }
      />
    </span>
  );
}
