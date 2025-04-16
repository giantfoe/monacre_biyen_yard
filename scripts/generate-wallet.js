//@ts-check
import { generateSigner } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import fs from 'fs';
import path from 'path';

async function generateWallet() {
  const umi = createUmi('https://api.devnet.solana.com');
  const keypair = generateSigner(umi);
  
  const dir = './scripts';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dir, 'wallet.json'),
    JSON.stringify(Array.from(keypair.secretKey))
  );
  
  console.log('New wallet generated!');
  console.log('Public key:', keypair.publicKey.toString());
  console.log('Wallet saved to:', path.join(dir, 'wallet.json'));
}

generateWallet().catch(console.error);