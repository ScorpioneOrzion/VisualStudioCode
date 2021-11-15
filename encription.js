function encryptData(data, key) {
    let encryptedData = "";
    let dataArray = data.split("").map(charactar => charactar.charCodeAt(0));

    for (let i = 0; i < dataArray.length - 1; i++) {
        encryptedData += String.fromCharCode(dataArray[i] + dataArray[i + 1]);
    }
    encryptedData += String.fromCharCode(dataArray[dataArray.length - 1]);
    return CryptoJS.AES.encrypt(encryptedData, key).toString();
}

function decryptData(data, key) {
    let dataArray = CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8).split("").map(charactar => charactar.charCodeAt(0)).reverse();
    let decryptedData = "";
    let lastChar = 0;

    for (let i = 0; i < dataArray.length; i++) {
        decryptedData += String.fromCharCode(dataArray[i] - lastChar);
        lastChar = dataArray[i] - lastChar;
    }

    return decryptedData.split('').reverse().join('');
}

function saveData(name, data) {
    localStorage.setItem(name, encryptData(data, name));
}

function loadData(name) {
    return decryptData(localStorage.getItem(name), name);
}

function clearData(name) {
    localStorage.removeItem(name);
}

export { saveData, loadData, clearData };