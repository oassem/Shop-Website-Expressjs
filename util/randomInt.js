const generateRandomId = () => {
    const randomId = Math.floor(Math.random() * 1000);
    const randomIdString = randomId.toString().padStart(3, '0');
    return randomIdString;
}

exports.generateRandomId = generateRandomId