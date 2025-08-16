import { Keypair } from "@solana/web3.js";
import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import bs58 from 'bs58';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert private key in different formats
const convertPrivateKey = (privateKeyInput, outputFormat = 'array') => {
  try {
    let keypair;
    
    // If already in array format
    if (Array.isArray(privateKeyInput)) {
      keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyInput));
      console.log("Successfully created keypair from array format");
    }
    // If it's a string format
    else if (typeof privateKeyInput === 'string') {
      // Try to parse as JSON array
      try {
        const parsed = JSON.parse(privateKeyInput);
        if (Array.isArray(parsed)) {
          keypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
          console.log("Successfully created keypair from JSON array string");
        }
      } catch (e) {
        // Not a JSON array, continue trying other formats
      }
      
      // Try to parse as Base58 string (common Solana format)
      if (!keypair) {
        try {
          const decoded = bs58.decode(privateKeyInput);
          if (decoded.length === 64) {
            keypair = Keypair.fromSecretKey(decoded);
            console.log("Successfully created keypair from Base58 string");
          }
        } catch (e) {
          // Not Base58, continue trying
        }
      }
      
      // Try to parse as Base64 string
      if (!keypair) {
        try {
          keypair = Keypair.fromSecretKey(
            Uint8Array.from(Buffer.from(privateKeyInput, 'base64'))
          );
          console.log("Successfully created keypair from Base64 string");
        } catch (e) {
          // Not Base64, continue trying
        }
      }
      
      // Try to parse as hexadecimal string
      if (!keypair) {
        try {
          // Remove possible 0x prefix
          const hexString = privateKeyInput.startsWith('0x') 
            ? privateKeyInput.slice(2) 
            : privateKeyInput;
          
          // Ensure length is even
          if (hexString.length % 2 === 0) {
            keypair = Keypair.fromSecretKey(
              Uint8Array.from(Buffer.from(hexString, 'hex'))
            );
            console.log("Successfully created keypair from hexadecimal string");
          }
        } catch (e) {
          // Not hexadecimal, continue trying
        }
      }
      
      // Try to parse as comma-separated number string
      if (!keypair) {
        try {
          const numbers = privateKeyInput.split(',').map(num => parseInt(num.trim()));
          if (numbers.length === 64 && numbers.every(num => !isNaN(num) && num >= 0 && num <= 255)) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(numbers));
            console.log("Successfully created keypair from comma-separated number string");
          }
        } catch (e) {
          // Not comma-separated numbers
        }
      }
    }
    
    if (!keypair) {
      throw new Error('Unable to parse private key format');
    }
    
    // Output results in different formats
    const result = {
      publicKey: keypair.publicKey.toString(),
      secretKey: keypair.secretKey,
      formats: {}
    };
    
    // Array format
    result.formats.array = Array.from(keypair.secretKey);
    
    // Base58 format (common in Solana)
    result.formats.base58 = bs58.encode(keypair.secretKey);
    
    // Base64 format
    result.formats.base64 = Buffer.from(keypair.secretKey).toString('base64');
    
    // Hexadecimal format
    result.formats.hex = Buffer.from(keypair.secretKey).toString('hex');
    
    // Comma-separated format
    result.formats.comma = Array.from(keypair.secretKey).join(',');
    
    // JSON array string format
    result.formats.jsonString = JSON.stringify(Array.from(keypair.secretKey));
    
    return result;
    
  } catch (error) {
    throw new Error(`Private key conversion failed: ${error.message}`);
  }
};

// Save keypair to file
const saveKeypairToFile = async (secretKeyArray, filename) => {
  try {
    // If input is an array, use directly; if it's a keypair object, convert to array
    const arrayToSave = Array.isArray(secretKeyArray) 
      ? secretKeyArray 
      : Array.from(secretKeyArray.secretKey);
      
    await fs.writeFile(filename, JSON.stringify(arrayToSave, null, 2));
    console.log(`Keypair saved to: ${filename}`);
  } catch (error) {
    console.error(`Failed to save keypair: ${error.message}`);
  }
};

// Main function
const main = async () => {
  try {
    console.log("Solana Private Key Format Converter\n");
    
    // Example private key (you can replace with your own)
    // const examplePrivateKey = "[29,103...198,171]";
    // const examplePrivateKey = "oAfxEdjUsadk....abaa"
    
    console.log("Input private key format:");
    console.log(examplePrivateKey);
    console.log("\nStarting conversion...\n");
    
    // Convert private key
    const result = convertPrivateKey(examplePrivateKey);
    
    console.log("\nConversion results:");
    console.log("Public key:", result.publicKey);
    console.log("\nPrivate key formats:");
    console.log("Array format:", result.formats.array.slice(0, 5) + "...");
    console.log("Base58 format:", result.formats.base58);
    console.log("Base64 format:", result.formats.base64);
    console.log("Hexadecimal format:", result.formats.hex);
    console.log("Comma-separated format:", result.formats.comma.slice(0, 20) + "...");
    console.log("JSON string format:", result.formats.jsonString.slice(0, 50) + "...");
    
    // Save to file
    const outputFile = path.join(__dirname, "converted-keypair.json");
    await saveKeypairToFile(result.formats.array, outputFile);
    
    console.log("\nUsage instructions:");
    console.log("1. Replace the example private key above with your own");
    console.log("2. Run the script: node convert-key.js");
    console.log("3. View conversion results and saved file");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Run main function
main();
