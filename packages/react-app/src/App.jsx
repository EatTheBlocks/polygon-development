import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { LinkOutlined } from "@ant-design/icons";
import "./App.css";
import { Row, Col, Button, Menu, Alert, Input, List, Card, Switch as SwitchD } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import {
  useExchangePrice,
  useGasPrice,
  useUserProvider,
  useContractLoader,
  useContractReader,
  useEventListener,
  useBalance,
} from "./hooks";
import { Header, Account, Faucet, Ramp, Contract, GasGauge, Address, AddressInput, ThemeSwitch } from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { utils } from "ethers";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import StackGrid from "react-stack-grid";
import ReactJson from "react-json-view";
import assets from "./assets.js";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

console.log("📦 Assets: ", assets);

const targetNetwork = NETWORKS["mumbai"];

// 😬 Sorry for all the console logging
const DEBUG = true;

//EXAMPLE STARTING JSON:
const STARTING_JSON = {
  description: "It's actually a bison?",
  external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
  image: "https://austingriffith.com/images/paintings/buffalo.jpg",
  name: "Buffalo",
  attributes: [
    {
      trait_type: "BackgroundColor",
      value: "green",
    },
    {
      trait_type: "Eyes",
      value: "googly",
    },
  ],
};

//helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path);
    if (!file.content) continue;
    const content = new BufferList();
    for await (const chunk of file.content) {
      content.append(chunk);
    }
    console.log(content);
    return content;
  }
};

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mumbai");
const mainnetInfura = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
const localProviderUrl = targetNetwork.rpcUrl;
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);

const blockExplorer = targetNetwork.blockExplorer;

function App(props) {
  const mainnetProvider = mainnetInfura;
  if (DEBUG) console.log("🌎 mainnetProvider", mainnetProvider);

  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 This hook will get the price of MATIC from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);
  if (DEBUG) console.log("👩‍💼 selected address:", address);

  // You can warn the user if you would like them to be on a specific network
  let localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  if (DEBUG) console.log("🏠 localChainId", localChainId);

  let selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;
  if (DEBUG) console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  const yourLocalBalance = useBalance(localProvider, address);
  if (DEBUG) console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...");

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);
  if (DEBUG) console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...");

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  if (DEBUG) console.log("📝 readContracts", readContracts);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);
  if (DEBUG) console.log("🔐 writeContracts", writeContracts);

  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "YourCollectible", "balanceOf", [address]);
  console.log("🤗 balance:", balance);

  //📟 Listen for broadcast events
  const transferEvents = useEventListener(readContracts, "YourCollectible", "Transfer", localProvider, 1);
  console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber();
  const [yourCollectibles, setYourCollectibles] = useState();

  useEffect(() => {
    const updateYourCollectibles = async () => {
      let collectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          console.log("GEtting token index", tokenIndex);
          const tokenId = await readContracts.YourCollectible.tokenOfOwnerByIndex(address, tokenIndex);
          console.log("tokenId", tokenId);
          const tokenURI = await readContracts.YourCollectible.tokenURI(tokenId);
          console.log("tokenURI", tokenURI);

          const strength = await readContracts.YourCollectible.tokenStrength(
            utils.id(tokenURI.replace("https://ipfs.io/ipfs/", "")),
          );

          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          console.log("ipfsHash", ipfsHash);

          const jsonManifestBuffer = await getFromIPFS(ipfsHash);

          try {
            const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
            console.log("jsonManifest", jsonManifest);
            collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest, strength: strength });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourCollectibles(collectibleUpdate);
    };
    updateYourCollectibles();
  }, [address, yourBalance]);

  let networkDisplay = "";
  if (localChainId && selectedChainId && localChainId != selectedChainId) {
    networkDisplay = (
      <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
        <Alert
          message={"⚠️ Wrong Network"}
          description={
            <div>
              You have <b>{NETWORK(selectedChainId).name}</b> selected and you need to be on{" "}
              <b>{NETWORK(localChainId).name}</b>.
            </div>
          }
          type="error"
          closable={false}
        />
      </div>
    );
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable =
    localProvider &&
    localProvider.connection &&
    localProvider.connection.url &&
    localProvider.connection.url.indexOf(window.location.hostname) >= 0 &&
    !process.env.REACT_APP_PROVIDER &&
    price > 1;

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId == 31337 &&
    yourLocalBalance &&
    formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type={"primary"}
          onClick={() => {
            faucetTx({
              to: address,
              value: parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  const [yourJSON, setYourJSON] = useState(STARTING_JSON);
  const [sending, setSending] = useState();
  const [ipfsHash, setIpfsHash] = useState();
  const [ipfsDownHash, setIpfsDownHash] = useState();

  const [downloading, setDownloading] = useState();
  const [ipfsContent, setIpfsContent] = useState();

  const [transferToAddresses, setTransferToAddresses] = useState({});

  const [loadedAssets, setLoadedAssets] = useState();
  useEffect(() => {
    const updateYourCollectibles = async () => {
      let assetUpdate = [];
      for (let a in assets) {
        try {
          const forSale = await readContracts.YourCollectible.forSale(utils.id(a));
          let owner;
          let strength = 0;
          if (!forSale) {
            strength = await readContracts.YourCollectible.tokenStrength(utils.id(a));
            const tokenId = await readContracts.YourCollectible.uriToTokenId(utils.id(a));
            owner = await readContracts.YourCollectible.ownerOf(tokenId);
          }
          assetUpdate.push({ id: a, ...assets[a], forSale: forSale, owner: owner, strength });
        } catch (e) {
          console.log(e);
        }
      }
      setLoadedAssets(assetUpdate);
    };
    if (readContracts && readContracts.YourCollectible) updateYourCollectibles();
  }, [assets, readContracts, transferEvents]);

  let galleryList = [];
  for (let a in loadedAssets) {
    console.log("loadedAssets", a, loadedAssets[a]);

    let cardActions = [];
    if (loadedAssets[a].forSale) {
      cardActions.push(
        <div>
          <Button
            onClick={() => {
              console.log("gasPrice,", gasPrice);
              tx(writeContracts.YourCollectible.mintItem(loadedAssets[a].id, { gasPrice: gasPrice }));
            }}
          >
            Mint
          </Button>
        </div>,
      );
    } else {
      cardActions.push(
        <div>
          owned by:{" "}
          <Address
            address={loadedAssets[a].owner}
            ensProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            minimized={true}
          />
          <div>str:{loadedAssets[a].strength}</div>
        </div>,
      );
    }

    galleryList.push(
      <Card
        style={{ width: 200 }}
        key={loadedAssets[a].name}
        actions={cardActions}
        title={
          <div>
            {loadedAssets[a].name}{" "}
            <a style={{ cursor: "pointer", opacity: 0.33 }} href={loadedAssets[a].external_url} target="_blank">
              <LinkOutlined />
            </a>
          </div>
        }
      >
        <img style={{ maxWidth: 130 }} src={loadedAssets[a].image} />
        <div style={{ opacity: 0.77 }}>{loadedAssets[a].description}</div>
      </Card>,
    );
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {networkDisplay}

      <BrowserRouter>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Gallery
            </Link>
          </Menu.Item>
          <Menu.Item key="/yourcollectibles">
            <Link
              onClick={() => {
                setRoute("/yourcollectibles");
              }}
              to="/yourcollectibles"
            >
              YourCollectibles
            </Link>
          </Menu.Item>
          <Menu.Item key="/transfers">
            <Link
              onClick={() => {
                setRoute("/transfers");
              }}
              to="/transfers"
            >
              Transfers
            </Link>
          </Menu.Item>
          <Menu.Item key="/ipfsup">
            <Link
              onClick={() => {
                setRoute("/ipfsup");
              }}
              to="/ipfsup"
            >
              IPFS Upload
            </Link>
          </Menu.Item>
          <Menu.Item key="/ipfsdown">
            <Link
              onClick={() => {
                setRoute("/ipfsdown");
              }}
              to="/ipfsdown"
            >
              IPFS Download
            </Link>
          </Menu.Item>
          <Menu.Item key="/debugcontracts">
            <Link
              onClick={() => {
                setRoute("/debugcontracts");
              }}
              to="/debugcontracts"
            >
              Debug Contracts
            </Link>
          </Menu.Item>
        </Menu>

        <Switch>
          <Route exact path="/">
            <div style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 256 }}>
              <StackGrid columnWidth={200} gutterWidth={16} gutterHeight={16}>
                {galleryList}
              </StackGrid>
            </div>
          </Route>

          <Route path="/yourcollectibles">
            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <List
                bordered
                dataSource={yourCollectibles}
                renderItem={item => {
                  console.log("ITEM", item);
                  const id = item.id.toNumber();
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> {item.name}
                          </div>
                        }
                      >
                        <div>
                          <img src={item.image} style={{ maxWidth: 150 }} />
                        </div>
                        <div>{item.description}</div>
                        <div>strength: {item.strength}</div>
                      </Card>

                      <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            let update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.YourCollectible.transferFrom(address, transferToAddresses[id], id));
                          }}
                        >
                          Transfer
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
          </Route>

          <Route path="/transfers">
            <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <List
                bordered
                dataSource={transferEvents}
                renderItem={item => {
                  return (
                    <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber + "_" + item[2].toNumber()}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>#{item[2].toNumber()}</span>
                      <Address address={item[0]} ensProvider={mainnetProvider} fontSize={16} /> =>
                      <Address address={item[1]} ensProvider={mainnetProvider} fontSize={16} />
                    </List.Item>
                  );
                }}
              />
            </div>
          </Route>

          <Route path="/ipfsup">
            <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
              <ReactJson
                style={{ padding: 8 }}
                src={yourJSON}
                theme={"pop"}
                enableClipboard={false}
                onEdit={(edit, a) => {
                  setYourJSON(edit.updated_src);
                }}
                onAdd={(add, a) => {
                  setYourJSON(add.updated_src);
                }}
                onDelete={(del, a) => {
                  setYourJSON(del.updated_src);
                }}
              />
            </div>

            <Button
              style={{ margin: 8 }}
              loading={sending}
              size="large"
              shape="round"
              type="primary"
              onClick={async () => {
                console.log("UPLOADING...", yourJSON);
                setSending(true);
                setIpfsHash();
                const result = await ipfs.add(JSON.stringify(yourJSON)); //addToIPFS(JSON.stringify(yourJSON))
                if (result && result.path) {
                  setIpfsHash(result.path);
                }
                setSending(false);
                console.log("RESULT:", result);
              }}
            >
              Upload to IPFS
            </Button>

            <div style={{ padding: 16, paddingBottom: 150 }}>{ipfsHash}</div>
          </Route>
          <Route path="/ipfsdown">
            <div style={{ paddingTop: 32, width: 740, margin: "auto" }}>
              <Input
                value={ipfsDownHash}
                placeHolder={"IPFS hash (like QmadqNw8zkdrrwdtPFK1pLi8PPxmkQ4pDJXY8ozHtz6tZq)"}
                onChange={e => {
                  setIpfsDownHash(e.target.value);
                }}
              />
            </div>
            <Button
              style={{ margin: 8 }}
              loading={sending}
              size="large"
              shape="round"
              type="primary"
              onClick={async () => {
                console.log("DOWNLOADING...", ipfsDownHash);
                setDownloading(true);
                setIpfsContent();
                const result = await getFromIPFS(ipfsDownHash); //addToIPFS(JSON.stringify(yourJSON))
                if (result && result.toString) {
                  setIpfsContent(result.toString());
                }
                setDownloading(false);
              }}
            >
              Download from IPFS
            </Button>

            <pre style={{ padding: 16, width: 500, margin: "auto", paddingBottom: 150 }}>{ipfsContent}</pre>
          </Route>
          <Route path="/debugcontracts">
            <Contract
              name="YourCollectible"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        {faucetHint}
      </div>

      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button>
              <a>Polygon</a>
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

window.ethereum &&
  window.ethereum.on("chainChanged", chainId => {
    setTimeout(() => {
      window.location.reload();
    }, 1);
  });

export default App;
