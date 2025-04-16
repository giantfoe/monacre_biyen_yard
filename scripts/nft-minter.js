//@ts-check

import { create, mplCore } from '@metaplex-foundation/mpl-core';
import {
	createGenericFile,
	generateSigner,
	keypairIdentity,
	signerIdentity,
	sol
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { readFileSync } from 'fs';

// Function to load keypair from a file
function loadKeypairFromFile(filePath) {
	const fileContent = readFileSync(filePath, 'utf-8');
	const secretKey = Uint8Array.from(JSON.parse(fileContent));
	return secretKey;
}
// Simulated ARIPO registration function
async function registerWithARIPO(ipData) {
	// In a real scenario, this would interact with ARIPO's systems
	console.log('Registering IP with ARIPO:', ipData);
	return {
		registrationNumber: 'ARIPO' + Math.floor(Math.random() * 1000000),
		registrationDate: new Date().toISOString(),
		...ipData
	};
}

// Function to mint NFT representing the IP
// Generate government land registry ID
async function generateLandRegistryId(propertyType) {
    const prefix = 'MOLHCP';
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${randomNum}`;
}

async function mintIPNFT(umi, landData) {
    // Create metadata
    const metadata = {
        name: `${landData.propertyAddress} - Land Title NFT`,
        description: `Digital Land Title for property located at ${landData.propertyAddress}`,
        image: landData.propertyImage,
        external_url: 'https://landregistry.gov.example',
        attributes: [
            { trait_type: 'Government Registry ID', value: landData.registryId },
            { trait_type: 'Registration Date', value: landData.registrationDate },
            { trait_type: 'Land Size (sq m)', value: landData.landSize },
            { trait_type: 'GPS Coordinates', value: landData.gpsCoordinates },
            { trait_type: 'Property Type', value: landData.propertyType },
            { trait_type: 'Validation Status', value: 'Approved' },
            { trait_type: 'Validator Address', value: landData.validatorAddress }
        ],
        properties: {
            files: [
                { uri: landData.propertyImage, type: 'image/png' },
                { uri: landData.deedDocument, type: 'application/pdf' }
            ],
            category: 'real_estate'
        }
    };

	// Upload metadata
	console.log('Uploading Metadata...');
	const metadataUri = await umi.uploader.uploadJson(metadata);

	// Mint NFT
	const nftSigner = generateSigner(umi);
	console.log('NFT SIGNER:', nftSigner.publicKey.toString());

	console.log('Minting NFT...');
	const tx = await create(umi, {
		asset: nftSigner,
		name: metadata.name,
		uri: metadataUri
	}).sendAndConfirm(umi);

	const signature = base58.deserialize(tx.signature)[0];

	console.log('\nNFT Minted');
	console.log('Transaction:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
	console.log('NFT:', `https://core.metaplex.com/explorer/${nftSigner.publicKey}?env=devnet`);

	return nftSigner.publicKey;
}

async function main() {
	// Setup Umi
	const umi = createUmi('https://api.devnet.solana.com')
		.use(mplCore())
		.use(irysUploader({ address: 'https://devnet.irys.xyz' }));

	// Load the keypair from file
	const secretKey = loadKeypairFromFile('./scripts/wallet.json');
	const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
	umi.use(keypairIdentity(keypair));

	console.log('Using public key:', keypair.publicKey);

	// Airdrop some SOL for testing (only if needed)
	const balance = await umi.rpc.getBalance(keypair.publicKey);
	if (balance.basisPoints.toString() === '0') {
		console.log('Airdropping 1 SOL to the keypair');
		await umi.rpc.airdrop(keypair.publicKey, sol(1));
	}
	// Airdrop some SOL for testing

	// Simulated IP data
	const ipData = {
		name: 'Innovative Trademark',
		type: 'Trademark',
		image: 'https://example.com/trademark-image.png' // Replace with actual image upload
	};

	// Register with ARIPO
	const aripoData = await registerWithARIPO(ipData);

	// Mint NFT
	// Sample land data
    const landData = {
        propertyAddress: '123 Blockchain Street, Crypto City',
        registryId: await generateLandRegistryId(),
        registrationDate: new Date().toISOString(),
        landSize: '500',
        gpsCoordinates: '40.7128° N, 74.0060° W',
        propertyType: 'Residential',
        validatorAddress: keypair.publicKey.toString(),
        propertyImage: 'https://example.com/property-image.png',
        deedDocument: 'https://example.com/deed.pdf'
    };

    // Mint NFT with land data
    const nftPublicKey = await mintIPNFT(umi, landData);

    console.log('Land Title NFT Created');
    console.log('Government Registry ID:', landData.registryId);
    console.log('NFT Public Key:', nftPublicKey);
}

main().catch(console.error);
