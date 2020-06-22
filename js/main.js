"use strict";




let payloadForm = {
    EmailAccountType: {type: "string", choices: ["EmailTypeIMAP"]},
    EmailAddress: {type: "string"},
    EmailAccountDescription: {type: "string"},

    IncomingMailServerAuthentication: {type: "string", choices: ["EmailAuthPassword"]},
    IncomingMailServerHostName: {type: "string"},
    IncomingMailServerPortNumber: {type: "number"},
    IncomingMailServerUsername: {type: "string"},
    IncomingMailServerUseSSL: {type: "boolean"},

    OutgoingMailServerAuthentication: {type: "string", choices: ["EmailAuthPassword"]},
    OutgoingMailServerHostName: {type: "string"},
    OutgoingMailServerPortNumber: {type: "number"},
    OutgoingMailServerUsername: {type: "string"},
    OutgoingMailServerUseSSL: {type: "boolean"},
    OutgoingPasswordSameAsIncomingPassword: {type: "boolean"},

    PayloadDescription: {type: "string"},
    PayloadDisplayName: {type: "string"},
    PayloadIdentifier: {type: "string"},
    PayloadType: {type: "string", constant: true, value: "com.apple.mail.managed"},
    PayloadUUID: {type: "function", constant: true, value: generateUUID},
    PayloadVersion: {type: "number", constant: true, value: 1},
}

let containerForm = {
    PayloadDescription: {type: "string"},
    PayloadDisplayName: {type: "string"},
    PayloadIdentifier: {type: "string"},
    PayloadType: {type: "string", constant: true, value: "Configuration"},
    PayloadUUID: {type: "function", constant: true, value: generateUUID},
    PayloadVersion: {type: "number", constant: true, value: 1},
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function convertKeyValueToXml(xmlDoc, key, value) {
    let keyElement = xmlDoc.createElement("key");
    keyElement.innerHTML = key;

    let valueElementTag = null;
    if (typeof value === "function") {
        value = value();
    }
    if (typeof value === "number") {
        valueElementTag = "integer";
    }
    else if (typeof value === "string") {
        valueElementTag = "string";
    }
    else if (typeof value === "boolean") {
        valueElementTag = String(value);
    }
    if (valueElementTag === null) {
        throw Error("Value type not recognized")
    }
    let valueElement = xmlDoc.createElement(valueElementTag);
    if (typeof value === "number" || typeof value === "string"){
        valueElement.innerHTML = value;
    }
    return [keyElement, valueElement];
}

function generateProfile(event) {
    let payload = {
        EmailAccountType: "EmailTypeIMAP",
        EmailAddress: "gabriel@augendre.info",
        EmailAccountDescription: "Migadu",

        IncomingMailServerAuthentication: "EmailAuthPassword",
        IncomingMailServerHostName: "imap.migadu.com",
        IncomingMailServerPortNumber: 993,
        IncomingMailServerUsername: "gabriel@augendre.info",
        IncomingMailServerUseSSL: true,

        OutgoingMailServerAuthentication: "EmailAuthPassword",
        OutgoingMailServerHostName: "smtp.migadu.com",
        OutgoingMailServerPortNumber: 465,
        OutgoingMailServerUsername: "gabriel@augendre.info",
        OutgoingMailServerUseSSL: true,
        OutgoingPasswordSameAsIncomingPassword: true,

        PayloadDisplayName: "Migadu",
        PayloadIdentifier: "info.augendre.mail.config.migadu",
        PayloadType: "com.apple.mail.managed",
        PayloadUUID: generateUUID,
        PayloadVersion: 1,
    }

    let container = {
        PayloadDescription: "Migadu email configuration profile",
        PayloadDisplayName: "Migadu",
        PayloadIdentifier: "info.augendre.mail.config.migadu",
        PayloadType: "Configuration",
        PayloadUUID: generateUUID,
        PayloadVersion: 1,
    }
    let downloadLink = document.getElementById("download-link");
    if (downloadLink) {
        document.body.removeChild(downloadLink);
    }

    let template = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
        "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n" +
        "<plist version='1.0'><dict></dict></plist>"
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(template, "application/xml");
    let dict = xmlDoc.getElementsByTagName("dict")[0];

    let contentElement = xmlDoc.createElement("key");
    contentElement.innerHTML = "PayloadContent";
    dict.appendChild(contentElement);
    let arrayElement = xmlDoc.createElement("array");
    dict.appendChild(arrayElement);
    let contentDict = xmlDoc.createElement("dict");
    arrayElement.appendChild(contentDict);

    for (let [key, value] of Object.entries(payload)) {
        let [keyElement, valueElement] = convertKeyValueToXml(xmlDoc, key, value);
        contentDict.appendChild(keyElement);
        contentDict.appendChild(valueElement);
    }

    for (let [key, value] of Object.entries(container)) {
        let [keyElement, valueElement] = convertKeyValueToXml(xmlDoc, key, value);
        dict.appendChild(keyElement);
        dict.appendChild(valueElement);
    }


    var serializer = new XMLSerializer();
    var xmlString = serializer.serializeToString(xmlDoc);

    let area = document.getElementById("profile");
    area.value = xmlString;

    let link = document.createElement('a');
    link.setAttribute("id", "download-link")
    link.setAttribute('href', 'data:application/xml;charset=utf-8,' + encodeURIComponent(xmlString));
    link.setAttribute('download', `${payload.EmailAddress}.mobileconfig`);
    link.innerHTML = "Download profile";
    document.body.appendChild(link);
}

function getElemFromConfig(key, value, prefix) {
    const identifier = `${prefix}-${key}`;
    let input = document.createElement("input");
    input.setAttribute("type", value.type);
    input.setAttribute("id", identifier);
    input.setAttribute("name", identifier);

    let defaultValue = value.value;
    if (typeof defaultValue === "function") {
        defaultValue = defaultValue();
    }
    if (defaultValue) {
        input.value = defaultValue;
    }
    if (value.constant) {
        input.setAttribute("disabled", "disabled");
    }

    let label = document.createElement("label");
    label.setAttribute("for", identifier);
    label.innerHTML = key;

    const p = document.createElement("p");
    p.appendChild(label);
    p.appendChild(input);
    return p;
}

document.addEventListener("DOMContentLoaded", function(){
    let form = document.getElementById("profile-form");
    let button = document.querySelector("form#profile-form button[type='button']");
    let title = document.createElement("h2");
    title.innerHTML = "Container"
    form.insertBefore(title, button);
    for (let [key, value] of Object.entries(containerForm)) {
        let line = getElemFromConfig(key, value, "container");
        form.insertBefore(line, button);
    }
    title = document.createElement("h2");
    title.innerHTML = "Payload"
    form.insertBefore(title, button);
    for (let [key, value] of Object.entries(payloadForm)) {
        let line = getElemFromConfig(key, value, "payload");
        form.insertBefore(line, button);
    }
});

