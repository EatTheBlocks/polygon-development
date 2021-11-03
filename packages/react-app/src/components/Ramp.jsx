import React, { useState } from "react";
import { Button, Modal, Divider } from "antd";
import { DollarCircleOutlined } from "@ant-design/icons";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";


export default function Ramp(props) {
  const [modalUp, setModalUp] = useState("down");

  const type = "default";

  let allFaucets = []
  for(let n in props.networks){
    if(props.networks[n].chainId!=31337&&props.networks[n].chainId!=1){
      allFaucets.push(
        <p key={props.networks[n].id}>
          <Button
            style={{color:props.networks[n].color}}
            type={type}
            size="large"
            shape="round"
            onClick={() => {
              window.open(props.networks[n].faucet);
            }}
          >
            {props.networks[n].name}
          </Button>
        </p>
      )
    }
  }

  return (
    <div>
      <Button
        size="large"
        shape="round"
        onClick={() => {
          setModalUp("up");
        }}
      >
        <DollarCircleOutlined style={{ color: "#52c41a" }} /> {typeof props.price == "undefined" ? 0 : props.price.toFixed(2)}
      </Button>
      <Modal
        title="Buy MATIC"
        visible={modalUp === "up"}
        onCancel={() => {
          setModalUp("down");
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setModalUp("down");
            }}
          >
            cancel
          </Button>,
        ]}
      >
        <p>
          <Button
            type={type}
            size="large"
            shape="round"
            onClick={() => {
              window.open("https://pay.sendwyre.com/purchase?destCurrency=MATIC&sourceAmount=25&dest=" + props.address);
            }}
          >
            <span style={{ paddingRight: 15 }} role="img">
              <span role="img" aria-label="flag-us">🇺🇸</span>
            </span>
            Wyre
          </Button>
        </p>
        <p>
          {" "}
          <Button
            type={type}
            size="large"
            shape="round"
            onClick={() => {
              new RampInstantSDK({
                hostAppName: "Polygon",
                hostLogoUrl: "https://polygon.technology/wp-content/uploads/2021/07/polygon-logo.svg",
                swapAmount: "100000000000000000", // 0.1 MATIC in wei  ?
                swapAsset: "MATIC",
                userAddress: props.address,
              })
                .on("*", event => console.log(event))
                .show();
            }}
          >
            <span style={{ paddingRight: 15 }} role="img">
            <span role="img" aria-label="flag-gb">🇬🇧</span>
            </span>
            Ramp
          </Button>
        </p>

        <p>
          <Button
            type={type}
            size="large"
            shape="round"
            onClick={() => {
              window.open("https://www.coinbase.com/buy-matic");
            }}
          >
            <span style={{ paddingRight: 15 }} role="img" aria-label="bank">
              🏦
            </span>
            Coinbase
          </Button>
        </p>

        <Divider />

        <h2>Mumbai MATIC</h2>

        {allFaucets}

      </Modal>
    </div>
  );
}
