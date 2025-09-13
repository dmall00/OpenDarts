const {AndroidConfig, withAndroidManifest} = require('@expo/config-plugins');
const {Paths} = require('@expo/config-plugins/build/android');
const path = require('path');
const fs = require('fs');

const {getMainApplicationOrThrow} = AndroidConfig.Manifest;

const withTrustLocalCerts = config => {
    return withAndroidManifest(config, async config => {
        config.modResults = await setCustomConfigAsync(config, config.modResults);
        return config;
    });
};

async function setCustomConfigAsync(config, androidManifest) {
    const srcFilePath = path.join(__dirname, "network_security_config.xml");
    const resFilePath = path.join(
        await Paths.getResourceFolderAsync(config.modRequest.projectRoot),
        "xml",
        "network_security_config.xml"
    );

    // Ensure the xml directory exists
    const resDir = path.resolve(resFilePath, "..");
    if (!fs.existsSync(resDir)) {
        await fs.promises.mkdir(resDir, {recursive: true});
    }

    // Copy the network security config file
    await fs.promises.copyFile(srcFilePath, resFilePath);

    // Add network security config to the main application
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    mainApplication.$["android:networkSecurityConfig"] = "@xml/network_security_config";

    return androidManifest;
}

module.exports = withTrustLocalCerts;
