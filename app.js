import {
    createNft,
    mplTokenMetadata,
  } from "@metaplex-foundation/mpl-token-metadata";
  import {
    createGenericFile,
    generateSigner,
    keypairIdentity,
    percentAmount,
  } from "@metaplex-foundation/umi";
  import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
  import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
  import {
    getKeypairFromFile,
  } from "@solana-developers/helpers";
  import { Connection, Keypair, PublicKey } from "@solana/web3.js";
  import { promises as fs } from "fs";
  import * as path from "path";
  import { fileURLToPath } from 'url';
  import { setAuthority, AuthorityType } from "@solana/spl-token";
  import { writeFileSync } from "fs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const mintNft = async () => {
    try {
      const connection = new Connection("https://api.mainnet-beta.solana.com");
  
            let user;
      try {
        user = await getKeypairFromFile();
        console.log("Successfully read keypair from default file");
      } catch (error) {
        throw new Error("Please provide private key or ensure keypair file exists");
      }

      if (!user) throw new Error("Unable to get valid keypair");

      console.log("Wallet address:", user.publicKey.toString());
  
      const umi = createUmi(connection);
      const umiKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  
      umi
        .use(keypairIdentity(umiKeypair))
        .use(mplTokenMetadata())
        .use(irysUploader({ address: "https://node1.irys.xyz" }));
  
      // Check balance
      const balance = await connection.getBalance(user.publicKey);
      const solBalance = balance / 1e9;
      console.log(`Wallet balance: ${solBalance} SOL`);
      if (solBalance < 0.02) {
        console.log("Warning: Insufficient wallet balance, recommend having at least 0.02 SOL for transaction fees");
      }
  
      const picpath = "xxxxxx.png"; // [Change your picture path]
      const imagePath = path.resolve(__dirname, picpath);
      const buffer = await fs.readFile(imagePath);
      let file = createGenericFile(buffer, picpath, {
         contentType: "image/png",
      });
    
      console.log("Uploading to mainnet...");
      const [image] = await umi.uploader.upload([file]);
      console.log("Upload successfully:", image);

      // Upload metadata
      console.log("Uploading metadata...");
      const uri = await umi.uploader.uploadJson({
        // [Change your metadata]
         name: "xxxxxx",
         symbol: "xxxxxx",
         description: "xxxxxx",
         image,
         external_url: "https://xxxxxx.com",
         attributes: [
            { trait_type: "xxxxxx", value: "xxxxxx" }
         ],
         properties: {
            files: [
                { uri: image, type: "image/png" }
            ],
            category: "image"
         }
      });
      console.log("Metadata uploaded successfully:", uri);
      // Generate new mint using generateSigner
      const mint = generateSigner(umi);
      // Save mint key to local file
      writeFileSync(
      "mint-keypair.json",
      JSON.stringify(Array.from(mint.secretKey))
      );
      console.log("Mint key saved to mint-keypair.json");
      
      // Create NFT
      console.log("Creating NFT...");
      await createNft(umi, {
        mint,
        name: "xxxx", // [Change your NFT name]
        symbol: "XX", // [Change your NFT symbol]
        uri,
        updateAuthority: umi.identity.publicKey,
        sellerFeeBasisPoints: percentAmount(50), // [Change your seller fee basis points]
      }).sendAndConfirm(umi, { send: { commitment: "finalized" } });

      console.log("NFT minted successfully on mainnet!");
      console.log("NFT address:", mint.publicKey.toString());
  
      // Transfer mint authority and freeze authority to your wallet
      // Need to use @solana/spl-token
      const payer = Keypair.fromSecretKey(user.secretKey);
      const mintPubkey = new PublicKey(mint.publicKey.toString());
      await setAuthority(
        connection,
        payer,
        mintPubkey,
        payer, // Current authority
        AuthorityType.MintTokens,
        payer.publicKey // Your wallet
      );
      await setAuthority(
        connection,
        payer,
        mintPubkey,
        payer,
        AuthorityType.FreezeAccount,
        payer.publicKey
      );

      console.log("Mint authority and freeze authority have been transferred to your wallet.");
      console.log("View NFT: https://explorer.solana.com/address/" + mint.publicKey.toString());
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  };
  
  mintNft();