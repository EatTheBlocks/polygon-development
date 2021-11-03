import React from "react";
import { PageHeader } from "antd";

// displays a page header

export default function Header() {
  return (
    <a href="https://polygon.technology" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="Polgon NFT strenght DApp"
        subTitle="Buyer pays to mint NFT example"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
