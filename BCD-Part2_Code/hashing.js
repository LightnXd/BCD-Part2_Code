require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const readlineSync = require("readline-sync");
const {Blockchain} = require('./blockchain');

const blockchain = new Blockchain('activity.js');

const userFile = 'user.json';
const secretFile = 'usersecret.txt';
const pepper = process.env.PEPPER || 'Default'; 
const iterations = parseInt(process.env.ITERATIONS, 10) || 1; 

function generateUserId(users) {
    const lastId = users.length > 0 ? parseInt(users[users.length - 1].ID.slice(1)) : 0;
    const newId = lastId + 1;
    return `U${newId.toString().padStart(5, '0')}`;
}

function hashPassword(password, salt, userId) {
    const splitIndex = Math.floor(Math.random() * 65); 
    const firstPart = salt.substring(0, splitIndex);
    const secondPart = salt.substring(splitIndex);
    const hashInput = firstPart + password + secondPart + userId + pepper;

    const hashedPassword = crypto.pbkdf2Sync(hashInput, salt, iterations, 32, 'sha256').toString('hex');

    return { hashedPassword, splitIndex };
}

function registerUser() {
    const name = readlineSync.question("Enter name: ");
    const password = readlineSync.question("Enter password: ", { hideEchoBack: true });
    const address = readlineSync.question("Enter address: ");
    const email = readlineSync.question("Enter email: ");
    const phoneNumber = readlineSync.question("Enter phone number: ");

    const users = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile)) : [];
    const userId = generateUserId(users);
    const salt = crypto.randomBytes(32).toString('hex');
    const { hashedPassword, splitIndex } = hashPassword(password, salt, userId);

    const newUser = { ID: userId, Name: name, UserAddress: address, Email: email, PhoneNumber: phoneNumber,};
    users.push(newUser);
    fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
    fs.appendFileSync(secretFile, `${userId},${hashedPassword},${salt},${splitIndex}\n`);
    
    console.log(`User registered successfully! ID: ${userId}`);
    blockchain.addBlock("New user:"+newUser.ID+", "+newUser.Name+" is added.");
    return newUser;  
}

function loginUser() {
    const name = readlineSync.question("Enter name: ");
    const password = readlineSync.question("Enter password: ", { hideEchoBack: true });

    const users = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile)) : [];
    const user = users.find(u => u.Name === name);

    if (!user) {
        console.log('User not found!');
        return null;
    }

    const lines = fs.readFileSync(secretFile, 'utf-8').trim().split('\n');
    const line = lines.find(line => line.startsWith(user.ID));

    if (!line) {
        console.log('User secret not found!');
        return null;
    }

    const [storedId, storedHash, salt, splitIndex] = line.split(',');
    const index = parseInt(splitIndex, 10);

    const firstPart = salt.substring(0, index);
    const secondPart = salt.substring(index);
    const hashInput = firstPart + password + secondPart + storedId + pepper;
    const hashedInputPassword = crypto.pbkdf2Sync(hashInput, salt, iterations, 32, 'sha256').toString('hex');

    if (hashedInputPassword === storedHash) {
        console.log('Login successful!');
        blockchain.addBlock(user.name+" Logging in. ");
        return { user, result: true };
    } else {
        console.log('Invalid password!');
        blockchain.addBlock("Failed login attemp detected.");
        return null;
    }
}


module.exports = { registerUser, loginUser };
