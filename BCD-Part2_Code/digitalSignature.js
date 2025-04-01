const crypto = require("crypto");
const fs = require("fs");
const readlineSync = require("readline-sync");

const deliveryChain = new Blockchain();
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

function loadDeliveryData() {
  const rawData = fs.readFileSync("delivery.txt");
  return JSON.parse(rawData);
}

function chooseDelivery(deliveries) {
  console.log("\nAvailable Deliveries:");
  deliveries.forEach((d, i) => {
    console.log(`${i + 1}. Delivery ID: ${d.deliveryId}, Status: ${d.status}, From: ${d.fromLocation}, To: ${d.toLocation}`);
  });
  const choice = readlineSync.questionInt("\nEnter the number of the delivery to confirm: ");
  return deliveries[choice - 1];
}

function signAndAddDeliveryBlock(courierId) {
  const deliveries = loadDeliveryData();
  const delivery = chooseDelivery(deliveries);

  const deliveryData = {
    courierId,
    deliveryId: delivery.deliveryId,
    requestId: delivery.requestId,
    from: delivery.fromLocation,
    to: delivery.toLocation,
    itemCount: delivery.itemCount,
    deliveredBy: delivery.deliveredBy,
    status: delivery.status,
    timestamp: delivery.timestamp,
  };

  const sign = crypto.createSign("SHA256");
  sign.update(JSON.stringify(deliveryData));
  sign.end();
  const signature = sign.sign(privateKey, "hex");

  const blockData = {
    delivery: deliveryData,
    signature,
    publicKey: publicKey.export({ type: "pkcs1", format: "pem" }),
  };

  const newBlock = new Block(
    deliveryChain.chain.length,
    blockData,
    deliveryChain.getLatestBlock().hash
  );

  deliveryChain.addBlock(newBlock);
  console.log("\nDelivery block added:", newBlock);
  console.log("\nVerifying blockchain integrity...");
  console.log("Blockchain valid?", deliveryChain.isChainValid());
}

function tamperWithBlock() {
  if (deliveryChain.chain.length > 1) {
    deliveryChain.chain[1].data.delivery.status = "TAMPERED";
    console.log("\nBlock tampered. Checking validity...");
    console.log("Blockchain valid?", deliveryChain.isChainValid());
  }
}

module.exports = { signAndAddDeliveryBlock, tamperWithBlock };
