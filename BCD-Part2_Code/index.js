const fs = require('fs');
const readlineSync = require("readline-sync"); //AB
const { registerUser, loginUser } = require("./hashing");
const { signAndAddDeliveryBlock, tamperWithBlock } = require("./digitalSignature"); //AB
const { Block, Blockchain } = require('./blockchain');

const blockchain = new Blockchain();

const userMenu = (user) => {
    while (true) {
        console.log(`\nWelcome ${user.Name}`); //AB: Corrected from user.name to user.Name
        console.log("1. Confirm Delivery"); //AB
        console.log("2. Tamper Blockchain (Test)"); //AB
        console.log("3. Back to Main Menu"); //AB
        console.log("4. Logout");

        const choice = readlineSync.question("Choose an option: ");
        
        if (choice === "1") {
            signAndAddDeliveryBlock(user.ID); //AB
        }
        else if (choice === "2") {
            tamperWithBlock(); //AB
        }
        else if (choice === "3") {
            return; //AB
        }
        else if (choice === "4") {
            return;
        }
        else {
            console.log("Invalid option! Please try again.");
        }
    }
};

function startSystem() {
    while (true) {
        console.log("\n======================================");
        console.log("1. Register\n2. Login\n3. Exit");
        const choice = readlineSync.question("Choose an option: ");

        if (choice === "1") {
            const user = registerUser();
            if (user) userMenu(user);
        }
        else if (choice === "2") {
            const user = loginUser();
            if (user) userMenu(user);
        }
        else if (choice === "3") {
            console.log("Exiting system...\n3\n2\n1\nShutting Down");
            process.exit(0); 
        }
        else {
            console.log("Invalid choice, try again.");
        }
    }
}

startSystem();
