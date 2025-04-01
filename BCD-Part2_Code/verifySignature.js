const crypto = require("crypto");
const fs = require("fs");
const { Blockchain, Block } = require("./blockchain");

const deliveryChain = new Blockchain();

function loadBlocksWithSignatures() {
  const deliveries = JSON.parse(fs.readFileSync("delivery.txt"));
  deliveries.slice(0, 3).forEach((delivery) => {
    const deliveryData = {
      courierId: delivery.courierId,
      deliveryId: delivery.deliveryId,
      requestId: delivery.requestId,
      from: delivery.fromLocation,
      to: delivery.toLocation,
      itemCount: delivery.itemCount,
      deliveredBy: delivery.deliveredBy,
      status: delivery.status,
      timestamp: delivery.timestamp,
    };

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });

    const sign = crypto.createSign("SHA256");
    sign.update(JSON.stringify(deliveryData));
    sign.end();
    const signature = sign.sign(privateKey, "hex");

    const blockData = {
      delivery: deliveryData,
      signature,
      publicKey: publicKey.export({ type: "pkcs1", format: "pem" }),
    };

    const block = new Block(
      deliveryChain.chain.length,
      blockData,
      deliveryChain.getLatestBlock().hash
    );
    deliveryChain.addBlock(block);
  });
}

function verifySignature(block) {
  const { delivery, signature, publicKey } = block.data;
  const verify = crypto.createVerify("SHA256");
  verify.update(JSON.stringify(delivery));
  verify.end();
  return verify.verify(publicKey, signature, "hex");
}

function auditChain(chain) {
  console.log("\nVerifying All Block Signatures:");
  for (let i = 1; i < chain.chain.length; i++) {
    const block = chain.chain[i];
    const valid = verifySignature(block);
    console.log(`Block ${i} | Delivery ID: ${block.data.delivery.deliveryId} | Signature: ${valid ? "VALID" : "INVALID"}`);
  }
  console.log("\nChain Integrity:", chain.isChainValid() ? "Blockchain is valid" : "Blockchain is corrupted");
}

loadBlocksWithSignatures();
auditChain(deliveryChain);

module.exports = { auditChain, verifySignature };
