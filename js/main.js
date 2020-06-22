"use strict";

const data = {
    payload: {
        EmailAccountType: "",
        EmailAddress: "",
        EmailAccountDescription: "",

        IncomingMailServerAuthentication: "",
        IncomingMailServerHostName: "",
        IncomingMailServerPortNumber: 993,
        IncomingMailServerUsername: "",
        IncomingMailServerUseSSL: false,

        OutgoingMailServerAuthentication: "",
        OutgoingMailServerHostName: "",
        OutgoingMailServerPortNumber: 465,
        OutgoingMailServerUsername: "",
        OutgoingMailServerUseSSL: false,
        OutgoingPasswordSameAsIncomingPassword: false,

        PayloadDescription: "",
        PayloadDisplayName: "",
        PayloadIdentifier: "",
        PayloadType: "com.apple.mail.managed",
        PayloadUUID: generateUUID,
        PayloadVersion: 1,
    },
    payloadPlaceholders: {
        EmailAddress: "john@example.com",
        EmailAccountDescription: "Example email account",

        IncomingMailServerHostName: "imap.example.com",
        IncomingMailServerPortNumber: 993,
        IncomingMailServerUsername: "john@example.com",

        OutgoingMailServerHostName: "smtp.example.com",
        OutgoingMailServerPortNumber: 465,
        OutgoingMailServerUsername: "john@example.com",

        PayloadDescription: "Email configuration profile",
        PayloadDisplayName: "Display name",
        PayloadIdentifier: "com.apple.dns.reverse",
    },
    container: {
        PayloadDescription: "",
        PayloadDisplayName: "",
        PayloadIdentifier: "",
        PayloadType: "Configuration",
        PayloadUUID: generateUUID,
        PayloadVersion: 1,
    },
    containerPlaceholders: {
        PayloadDescription: "Email configuration profile",
        PayloadDisplayName: "Display name",
        PayloadIdentifier: "com.apple.dns.reverse",
    },
    generated: false,
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function convertKeyValueToXml(xmlDoc, key, value) {
    const keyElement = xmlDoc.createElement("key");
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
    const valueElement = xmlDoc.createElement(valueElementTag);
    if (typeof value === "number" || typeof value === "string"){
        valueElement.innerHTML = value;
    }
    return [keyElement, valueElement];
}

const app = new Vue({
    el: '#app',
    data: data,
    computed: {
        generatedProfile: function () {
            const template = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n" +
                "<plist version='1.0'><dict><key>PayloadContent</key><array><dict></dict></array></dict></plist>"

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(template, "application/xml");
            const dict = xmlDoc.getElementsByTagName("dict")[0];

            for (const [key, value] of Object.entries(this.container)) {
                const [keyElement, valueElement] = convertKeyValueToXml(xmlDoc, key, value);
                dict.appendChild(keyElement);
                dict.appendChild(valueElement);
            }

            const contentDict = xmlDoc.getElementsByTagName("dict")[1];
            for (const [key, value] of Object.entries(this.payload)) {
                const [keyElement, valueElement] = convertKeyValueToXml(xmlDoc, key, value);
                contentDict.appendChild(keyElement);
                contentDict.appendChild(valueElement);
            }

            const serializer = new XMLSerializer();
            return serializer.serializeToString(xmlDoc);
        },
        generatedProfileLink: function () {
            const xmlString = this.generatedProfile;
            return 'data:application/xml;charset=utf-8,' + encodeURIComponent(xmlString);
        },
        downloadFileName: function() {
            return `${this.payload.EmailAddress}.mobileconfig`;
        },
    }
})

