const fs = require('fs');
const SHA256 = require('crypto-js/sha256');

class Block {
    constructor(index, data, previousHash = '') {
        this.index = index;
        this.timestamp = new Date().toISOString();
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash).toString();
    }
}

class Blockchain {
    constructor(filename) {
        this.filename = filename;
        this.chain = [];
        this.loadBlockchain();
        if (this.chain.length === 0) {
            this.chain.push(this.createGenesisBlock());
            this.saveBlockchain();
        }
    }

    createGenesisBlock() {
        return new Block(0, "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data) {
        const index = this.chain.length;
        const previousHash = this.getLatestBlock().hash;
        const newBlock = new Block(index, data, previousHash);
        this.chain.push(newBlock);
        this.saveBlockchain();
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (currentBlock.hash !== currentBlock.calculateHash()) return false;
            if (currentBlock.previousHash !== previousBlock.hash) return false;
        }
        return true;
    }

    saveBlockchain() {
        fs.writeFileSync(this.filename, JSON.stringify(this.chain, null, 4));
    }

    loadBlockchain() {
        if (fs.existsSync(this.filename)) {
            const data = fs.readFileSync(this.filename);
            const chainData = JSON.parse(data);
            this.chain = chainData.map(block => {
                const newBlock = new Block(block.index, block.data, block.previousHash);
                newBlock.timestamp = block.timestamp;
                newBlock.hash = block.hash;
                return newBlock;
            });
        }
    }
}
module.exports = { Block, Blockchain };
