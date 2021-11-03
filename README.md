# NFT's strength

> Use Chainlink VRF to get a random strength for each NFT as it is minted.

## Quick Start

required: [Node](https://nodejs.org/dist/latest-v12.x/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

- Clone this repository

```bash

yarn install

```

```bash

yarn start

```

> in a second terminal window:

```bash
yarn chain

```

---

> Edit the artwork manifest `artwork.js` with all of your art, then upload it to IPFS:

> in a third terminal window:


```bash
yarn upload

yarn deploy

```

Open http://localhost:3000 to see the app

---

Your artwork from `artwork.json` (if uploaded and deployed correctly) should show a gallery of possible NFTS to mint:

![image](https://user-images.githubusercontent.com/2653167/110538535-5fe87980-80e1-11eb-83aa-fe2b53f9c277.png)


Use the faucet wallet icon in the bottom left of the frontend to give your address **$1000** in testnet MATIC.

---



This repo uses Chainlink's VRF on Mumbai.

> First call `getRandomNumber()` from the `debug contracts` tab:

![image](https://user-images.githubusercontent.com/2653167/111365232-d93f1980-8657-11eb-933f-e4e408e2c3ab.png)

> Wait for the `randomResult` to get set:

![image](https://user-images.githubusercontent.com/2653167/111365297-f247ca80-8657-11eb-9aed-d3867e489996.png)


> Finally, mint from the `gallery` tab and your NFT will have a `tokenStrength`:

![image](https://user-images.githubusercontent.com/2653167/111365450-1e634b80-8658-11eb-938c-a2523586dfd4.png)


---


Try to "Mint" an NFT:

![image](https://user-images.githubusercontent.com/2653167/110538992-ec933780-80e1-11eb-9d15-aaa7efea698d.png)


Open an *incognito* window and navigate to http://localhost:3000 (You'll notice it has a new wallet address).

Grab some gas for each account using the faucet:

![image](https://user-images.githubusercontent.com/2653167/109543971-35b10f00-7a84-11eb-832e-36d6b66afbe7.png)

Send an NFT to the *incognito* window just to make sure it works.

## Deploy NFT smart contract!

> Change the `defaultNetwork` in `packages/hardhat/hardhat.config.js` to `mumbai`

Generate a deploy account with `yarn generate`


View your deployer address using `yarn account` (You'll need to fund this account. Hint: use an [instant wallet](https://instantwallet.io) to fund your account via QR code)

Thoroughly check your `artwork.json` file and run:

```bash

yarn upload

```

Deploy your NFT smart contract:

```bash

yarn deploy

```
---
---

> ✏️ Edit your frontend `App.jsx` in `packages/react-app/src` to change the `targetNetwork` to `mumbai`


You should see the correct network in the frontend:

## Ship the app!

> build and upload your frontend and share the url in the ETB's discord.

```bash

# build it:

yarn build

# upload it:

yarn surge

yarn s3

yarn ipfs
```

### Original Credits
- [Austin griffith's Scaffold ETH](https://github.com/scaffold-eth/scaffold-eth/tree/chainlink-vrf-nft)
- [YT Video tutorial](https://youtu.be/63sXEPIEh-k?t=1773)